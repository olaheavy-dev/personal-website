// Writing standard (decision 0014): no dashes used as punctuation between
// words, in anything public. Fails on:
//   - an em dash (U+2014), horizontal bar (U+2015) or the HTML entity for an em dash, anywhere;
//   - an en dash (U+2013) or its HTML entity, unless it sits between two digits (a range like 2018 to 2021);
//   - a spaced hyphen used as a dash ("word - word") in prose: Markdown and YAML lines, and in source
//     files the parts that are words rather than code (string literals, JSX text and comments), so
//     subtraction such as `a - b` is left alone.
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
import { pathToFileURL } from "node:url";

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
const proseExtensions = new Set([".md", ".mdx", ".yml", ".yaml", ".txt", ""]);
const scriptExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
// The checker and its tests contain the forbidden characters on purpose.
const skipFiles = new Set([
  "pnpm-lock.yaml",
  "scripts/check-dashes.mjs",
  "scripts/check-dashes.test.ts",
  "CLAUDE.md",
]);
const generatedBlock = { start: "<!-- BEGIN:nextjs-agent-rules -->", end: "<!-- END:nextjs-agent-rules -->" };
const spacedHyphen = /[\p{L}\p{N},.;:)\]'"’*_!?] - [\p{L}\p{N}(['"‘*_]/u;

function dashProblems(line) {
  const found = [];
  if (line.includes(EM) || line.includes(BAR) || /&mdash;/i.test(line)) found.push("em dash");
  const enDashes = [...line.matchAll(new RegExp(`(.)?(?:${EN}|&ndash;)(.)?`, "gi"))];
  if (enDashes.some((m) => !(/\d/.test(m[1] ?? "") && /\d/.test(m[2] ?? "")))) {
    found.push("en dash between words");
  }
  return found;
}

// The parts of a source-code line that are words, not code: comments, string
// literals (with template expressions removed) and, in JSX, text between tags.
// `state.inBlockComment` carries `/* ... */` across lines.
export function wordSegments(line, ext, state) {
  const segments = [];
  let code = line;

  if (state.inBlockComment) {
    const end = code.indexOf("*/");
    if (end === -1) return [code];
    segments.push(code.slice(0, end));
    code = code.slice(end + 2);
    state.inBlockComment = false;
  }
  code = code.replace(/\/\*([\s\S]*?)\*\//g, (_, comment) => {
    segments.push(comment);
    return " ";
  });
  const blockStart = code.indexOf("/*");
  if (blockStart !== -1) {
    segments.push(code.slice(blockStart + 2));
    code = code.slice(0, blockStart);
    state.inBlockComment = true;
  }
  if (ext === ".css") return segments; // CSS outside comments is code, e.g. calc(a - b)

  code = code.replace(/(["'`])((?:\\.|(?!\1).)*)\1/g, (_, quote, content) => {
    // Template expressions become a placeholder word, so `${a - b}` is ignored
    // but "Sunkanmi - ${role}" still reads as words around a dash.
    segments.push(quote === "`" ? content.replace(/\$\{[^}]*\}/g, "value") : content);
    return '""';
  });
  const lineComment = code.indexOf("//");
  if (lineComment !== -1) {
    segments.push(code.slice(lineComment + 2));
    code = code.slice(0, lineComment);
  }
  if (ext === ".tsx" || ext === ".jsx") {
    for (const match of code.matchAll(/>([^<>{}]+)</g)) segments.push(match[1]);
    // A line that is only text inside JSX (no code punctuation) is copy.
    const trimmed = code.trim();
    if (
      trimmed &&
      !/[=(){};<>[\]]/.test(trimmed) &&
      !/^(import|export|return|const|let|type)\b/.test(trimmed)
    ) {
      segments.push(trimmed);
    }
  }
  return segments;
}

export function checkText(name, text, ext) {
  const prose = proseExtensions.has(ext);
  const markdown = ext === ".md" || ext === ".mdx" || ext === "";
  const script = scriptExtensions.has(ext) || ext === ".css";
  const failures = [];
  const state = { inBlockComment: false };
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
    const problems = dashProblems(line);
    const proseParts = prose ? [line] : script ? wordSegments(line, ext, state) : [];
    if (proseParts.some((part) => spacedHyphen.test(part))) problems.push("spaced hyphen used as a dash");
    for (const problem of problems) {
      failures.push(`${name}:${index + 1}: ${problem}\n    ${raw.trim().slice(0, 160)}`);
    }
  });
  return failures;
}

function main() {
  const envIndex = process.argv.indexOf("--env");
  const failures = [];

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
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
