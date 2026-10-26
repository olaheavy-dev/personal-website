// Writing standard (decision 0014): no dashes used as punctuation between
// words, in anything public. Fails on:
//   - an em dash (U+2014), horizontal bar (U+2015) or the HTML entity for an em dash, anywhere;
//   - an en dash (U+2013) or its HTML entity, unless it sits between two digits (a range like 2018 to 2021);
//   - a spaced hyphen used as a dash ("word - word") in prose: Markdown and YAML lines, and in source
//     files the parts that are words rather than code (string literals, JSX text and comments, found
//     with the TypeScript parser), so subtraction such as `a - b` is left alone.
// Hyphenated words ("full-stack") are fine. Inline code and fenced code
// blocks in Markdown are skipped, as is the Next.js block that `next dev`
// regenerates inside AGENTS.md.
//
// Usage:
//   node scripts/check-dashes.mjs                 check every tracked or new text file
//   node scripts/check-dashes.mjs --env A,B       check the text in environment variables A and B
//                                                 (CI uses this for the PR title and description)
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { extname } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

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

// The parts of a source file that are words, not code, found with the real
// TypeScript parser: string literals, template text (expressions replaced by a
// placeholder word), JSX text and comments. Code itself, including subtraction
// such as `a - b` on any line, is never read. Returns { line, text } pieces.
export function wordSegments(text, ext) {
  if (ext === ".css") {
    // CSS outside comments is code, e.g. calc(a - b).
    return [...text.matchAll(/\/\*[\s\S]*?\*\//g)].flatMap((m) => piecesAt(text, m.index, m[0]));
  }
  const kind = ext === ".tsx" || ext === ".jsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile("check" + ext, text, ts.ScriptTarget.Latest, true, kind);
  const pieces = [];
  const seenComments = new Set();
  const addComments = (ranges) => {
    for (const range of ranges ?? []) {
      if (seenComments.has(range.pos)) continue;
      seenComments.add(range.pos);
      pieces.push(...piecesAt(text, range.pos, text.slice(range.pos, range.end)));
    }
  };
  const visit = (node) => {
    addComments(ts.getLeadingCommentRanges(text, node.getFullStart()));
    addComments(ts.getTrailingCommentRanges(text, node.getEnd()));
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      pieces.push(...piecesAt(text, node.getStart(source), node.text));
    } else if (ts.isTemplateExpression(node)) {
      const joined = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join("value");
      pieces.push(...piecesAt(text, node.getStart(source), joined));
    } else if (ts.isJsxText(node)) {
      pieces.push(...piecesAt(text, node.getStart(source), node.getText(source)));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return pieces;
}

// Splits a piece of text into per-line chunks tagged with their 1-based line.
function piecesAt(text, offset, content) {
  const firstLine = text.slice(0, offset).split("\n").length;
  return content.split("\n").map((chunk, index) => ({ line: firstLine + index, text: chunk }));
}

export function checkText(name, text, ext) {
  const prose = proseExtensions.has(ext);
  const markdown = ext === ".md" || ext === ".mdx" || ext === "";
  const script = scriptExtensions.has(ext) || ext === ".css";
  const lines = text.split("\n");
  const problems = new Map(); // line number -> problems
  const report = (lineNumber, problem) => {
    const list = problems.get(lineNumber) ?? [];
    if (!list.includes(problem)) list.push(problem);
    problems.set(lineNumber, list);
  };

  let inFence = false;
  let inGenerated = false;
  lines.forEach((raw, index) => {
    if (raw.includes(generatedBlock.start)) inGenerated = true;
    if (raw.includes(generatedBlock.end)) inGenerated = false;
    if (inGenerated) return;
    if (markdown && /^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const line = markdown ? raw.replace(/`[^`]*`/g, "``") : raw;
    for (const problem of dashProblems(line)) report(index + 1, problem);
    if (prose && spacedHyphen.test(line)) report(index + 1, "spaced hyphen used as a dash");
  });

  if (script) {
    for (const piece of wordSegments(text, ext)) {
      if (spacedHyphen.test(piece.text)) report(piece.line, "spaced hyphen used as a dash");
    }
  }

  return [...problems.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([lineNumber, list]) =>
      list.map(
        (problem) =>
          `${name}:${lineNumber}: ${problem}\n    ${(lines[lineNumber - 1] ?? "").trim().slice(0, 160)}`,
      ),
    );
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

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
