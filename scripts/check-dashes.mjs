// Writing standard (decision 0014): no dashes used as punctuation between
// words, in anything public. Fails on:
//   - an em dash (U+2014), horizontal bar (U+2015) or `&mdash;`, anywhere;
//   - an en dash (U+2013) or `&ndash;`, unless it sits between two digits (2018 to 2021 written with one is fine);
//   - in prose files (Markdown, YAML), a spaced hyphen used as a dash ("word - word").
// Hyphenated words ("full-stack") are fine. Inline code and fenced code
// blocks in Markdown are skipped, as is the Next.js block that `next dev`
// regenerates inside AGENTS.md.
//
// Usage:
//   node scripts/check-dashes.mjs                 check every tracked or new text file
//   node scripts/check-dashes.mjs --env A,B       check the text in environment variables A and B
//                                                 (CI uses this for the PR title and description)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const EM = String.fromCharCode(0x2014);
const BAR = String.fromCharCode(0x2015);
const EN = String.fromCharCode(0x2013);
const textExtensions = new Set([
  ".md",
  ".mdx",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".json",
  ".yml",
  ".yaml",
  ".html",
  ".txt",
]);
const proseExtensions = new Set([".md", ".mdx", ".yml", ".yaml", ""]);
const skipFiles = new Set(["pnpm-lock.yaml", "scripts/check-dashes.mjs", "CLAUDE.md"]);
const generatedBlock = { start: "<!-- BEGIN:nextjs-agent-rules -->", end: "<!-- END:nextjs-agent-rules -->" };

function problemsInLine(line, prose) {
  const found = [];
  if (line.includes(EM) || line.includes(BAR) || /&mdash;/i.test(line)) found.push("em dash");
  const enDashes = [...line.matchAll(new RegExp(`(.)?(?:${EN}|&ndash;)(.)?`, "gi"))];
  if (enDashes.some((m) => !(/\d/.test(m[1] ?? "") && /\d/.test(m[2] ?? ""))))
    found.push("en dash between words");
  if (prose && /[\p{L}\p{N},.;:)\]'"’*_] - [\p{L}\p{N}(\['"‘*_]/u.test(line))
    found.push("spaced hyphen used as a dash");
  return found;
}

function checkText(name, text, ext) {
  const prose = proseExtensions.has(ext);
  const markdown = ext === ".md" || ext === ".mdx" || ext === "";
  const failures = [];
  let inFence = false;
  let inGenerated = false;
  text.split("\n").forEach((raw, index) => {
    if (raw.includes(generatedBlock.start)) inGenerated = true;
    if (raw.includes(generatedBlock.end)) inGenerated = false;
    if (inGenerated) return;
    if (markdown && /^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const line = markdown ? raw.replace(/`[^`]*`/g, "``") : raw;
    for (const problem of problemsInLine(line, prose)) {
      failures.push(`${name}:${index + 1}: ${problem}\n    ${raw.trim().slice(0, 160)}`);
    }
  });
  return failures;
}

const envIndex = process.argv.indexOf("--env");
let failures = [];

if (envIndex !== -1) {
  for (const key of (process.argv[envIndex + 1] ?? "").split(",").filter(Boolean)) {
    failures.push(...checkText(`$${key}`, process.env[key] ?? "", ""));
  }
} else {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter((file) => file && !skipFiles.has(file) && textExtensions.has(extname(file)));
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue; // listed by git but deleted in the working tree
    }
    failures.push(...checkText(file, text, extname(file)));
  }
}

if (failures.length) {
  console.error(
    `dashes: ${failures.length} problem(s). Rewrite with a full stop, comma, colon, brackets or "to" (decision 0014).\n`,
  );
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("dashes ok");
