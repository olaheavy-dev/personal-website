// Fails when the Supabase browser values are missing or malformed at build time.
//
// Next.js writes NEXT_PUBLIC_* values into the build, so an image built without them
// would read Supabase as unconfigured for its whole life and show every gated page as
// Off. The Dockerfile and the publish workflow run this before building (issue #6).
// Messages name the variables and the rule, never a value.

import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

const projectUrl = /^https:\/\/[a-z]{20}\.supabase\.co$/;

/** Problems with the build environment, as readable lines. */
export function checkBuildEnv(env) {
  const problems = [];
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) problems.push("NEXT_PUBLIC_SUPABASE_URL is missing.");
  else if (!projectUrl.test(url)) {
    problems.push("NEXT_PUBLIC_SUPABASE_URL must look like https://<20 lowercase letters>.supabase.co.");
  }

  if (!key) problems.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.");
  else if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    problems.push(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must start with "sb_publishable_" and contain only letters, digits, "_" and "-".',
    );
  }

  return problems;
}

function main() {
  const problems = checkBuildEnv(process.env);
  if (problems.length) {
    console.error("check-build-env: the Supabase build values are not usable.");
    for (const problem of problems) console.error(`  ${problem}`);
    console.error(
      "  Set them as GitHub Actions variables (see docs/deploy.md). For a local smoke build only, use SUPABASE_OPTIONAL=1.",
    );
    process.exit(1);
  }
  console.log("check-build-env: the Supabase build values are present and well formed.");
}

// import.meta.url is the real path as a file URL (spaces and symbols escaped), so compare
// against the real path of argv[1] the same way; a raw string or a symlinked path would
// skip main() and exit 0 silently.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
