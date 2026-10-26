import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkText } from "./check-dashes.mjs";

const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const fails = (text: string, ext: string) => checkText("sample", text, ext).length > 0;

describe("check-dashes", () => {
  it("rejects an em dash in any file type", () => {
    for (const ext of [".md", ".tsx", ".ts", ".css", ".yml"]) {
      expect(fails(`Idea ${EM} production`, ext)).toBe(true);
    }
    expect(fails("expensive&nbsp;&mdash; banking", ".tsx")).toBe(true);
  });

  it("allows an en dash only between two digits", () => {
    expect(fails(`Access Bank (2018${EN}21)`, ".md")).toBe(false);
    expect(fails(`UK 2022${EN}now`, ".md")).toBe(true);
    expect(fails(`rounds 1 ${EN} 2`, ".md")).toBe(true);
  });

  it("rejects a spaced hyphen in prose", () => {
    expect(fails("Idea - production", ".md")).toBe(true);
    expect(fails('  - "P0/P1 - wrong content"', ".yml")).toBe(true);
    expect(fails("Idea - production", "")).toBe(true); // PR text
  });

  it("keeps Markdown list markers, hyphenated words and table rules", () => {
    expect(fails("- a full-stack engineer", ".md")).toBe(false);
    expect(fails("| --- | --- |", ".md")).toBe(false);
  });

  it("rejects a spaced hyphen in site copy inside source files", () => {
    expect(fails("<p>Idea - production</p>", ".tsx")).toBe(true);
    expect(fails('  description: "Idea - production",', ".ts")).toBe(true);
    expect(fails("  title: `Sunkanmi - ${role}`,", ".ts")).toBe(true);
    expect(fails("// spacing - see tokens", ".ts")).toBe(true);
    expect(fails("/* palette - light */", ".css")).toBe(true);
  });

  it("leaves subtraction and code alone", () => {
    expect(fails("const overflow = scrollWidth - clientWidth;", ".ts")).toBe(false);
    expect(fails("  {total - offset}", ".tsx")).toBe(false);
    expect(fails("const label = `${count - 1} left`;", ".ts")).toBe(false);
    expect(fails("  width: calc(100% - var(--gutter));", ".css")).toBe(false);
    expect(fails('<a href="https://example.com/a-b">Link</a>', ".tsx")).toBe(false);
  });

  it("leaves multi-line subtraction alone, in TS and TSX", () => {
    const sum = "const remaining = (\n  total - offset\n);";
    expect(fails(sum, ".tsx")).toBe(false);
    expect(fails(sum, ".ts")).toBe(false);
    expect(fails("return (\n  <p>\n    {total\n      - offset}\n  </p>\n);", ".tsx")).toBe(false);
  });

  it("reads multi-line JSX text as copy", () => {
    expect(fails("return (\n  <p>\n    Idea - production\n  </p>\n);", ".tsx")).toBe(true);
  });

  it("follows block comments across lines", () => {
    expect(fails("/* first line\n   idea - production */\nconst x = a - b;", ".ts")).toBe(true);
    expect(fails("/* first line\n   fine */\nconst x = a - b;", ".ts")).toBe(false);
  });

  it("skips Markdown code and the generated Next.js block", () => {
    expect(fails("Run `a - b` here", ".md")).toBe(false);
    expect(fails("```\nIdea - production\n```", ".md")).toBe(false);
    expect(
      fails(`<!-- BEGIN:nextjs-agent-rules -->\nchanges ${EM} APIs\n<!-- END:nextjs-agent-rules -->`, ".md"),
    ).toBe(false);
  });
});

// Issue #93, same fault: a path comparison without realpath skipped main() and exited 0 in
// silence when the script was started through a symlink or a folder name that is encoded.
describe("check-dashes command", () => {
  it("still runs its check when started through a symlink in a folder with a space", () => {
    const dir = mkdtempSync(join(tmpdir(), "check dashes "));
    try {
      const link = join(dir, "link.mjs");
      symlinkSync(join(process.cwd(), "scripts", "check-dashes.mjs"), link);
      const result = spawnSync("node", [link], { cwd: process.cwd(), encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("dashes ok");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
