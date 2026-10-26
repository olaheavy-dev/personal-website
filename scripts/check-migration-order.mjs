// Fails when a branch adds a migration that is not newer than every migration on main.
//
// `supabase db push` (CLI 2.122.0) refuses to run when a local migration is older than the
// newest one already applied to the hosted project (it reports a missing remote migration),
// and the publish workflow applies migrations before every build, so one out of order file
// would block every publish (decision 0019). Catch it on the pull request instead.
//
// How it compares: CI checks out only the pull request commit, with no history, so this
// fetches the tip of main (`git fetch --depth=1 origin main`, no credentials needed for a public
// repository) and lists its migration files with `git ls-tree`. A migration is "new" when its
// file name is not on main. On main itself nothing is new, so the check passes there.

import { execFileSync } from "node:child_process";
import { readdirSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

const directory = "supabase/migrations";
const fileName = /^(\d{14})_[a-z0-9_]+\.sql$/;

/** Problems, as readable lines, for the local migration file names against main's. */
export function findOrderProblems(mainNames, localNames) {
  const problems = [];
  const onMain = new Set(mainNames);
  for (const name of localNames) {
    if (!fileName.test(name)) problems.push(`${name} is not named <14 digit timestamp>_<snake_case>.sql.`);
  }
  const versions = mainNames.map((name) => name.match(fileName)?.[1]).filter(Boolean);
  const newest = versions.sort().at(-1);
  for (const name of localNames.filter((candidate) => !onMain.has(candidate))) {
    const version = name.match(fileName)?.[1];
    if (version && newest && version <= newest) {
      problems.push(
        `${name} is not newer than the newest migration on main (${newest}). Rename it with a newer timestamp (docs/database.md, Changing the schema).`,
      );
    }
  }
  return problems;
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function main() {
  const base = process.env.MIGRATION_BASE_REF ?? "origin/main";
  if (!process.env.MIGRATION_BASE_REF) git("fetch", "--quiet", "--depth=1", "origin", "main");
  const mainNames = git("ls-tree", "--name-only", base, `${directory}/`)
    .split("\n")
    .filter(Boolean)
    .map((path) => path.slice(directory.length + 1));
  const localNames = readdirSync(directory).filter((name) => name.endsWith(".sql"));
  const problems = findOrderProblems(mainNames, localNames);
  if (problems.length) {
    console.error("check-migration-order: a migration would break `supabase db push`.");
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-migration-order: every new migration is newer than the ones on ${base}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
