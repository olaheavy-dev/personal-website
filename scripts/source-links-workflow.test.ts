import { readFileSync } from "node:fs";

const text = readFileSync(".github/workflows/source-links.yml", "utf8");
const code = text
  .split("\n")
  .filter((l) => !l.trim().startsWith("#"))
  .join("\n");

describe("source-links workflow (A10)", () => {
  it("has no permissions at the top and only the two it needs on the job", () => {
    expect(code).toMatch(/^permissions: \{\}$/m);
    expect(code).toMatch(/permissions:\n\s+contents: read\n\s+issues: write\n/);
    expect(code).not.toMatch(/write-all|contents: write|pull-requests/);
  });
  it("pins every action to a full commit SHA", () => {
    const uses = [...code.matchAll(/uses: (\S+)/g)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) expect(u).toMatch(/@[0-9a-f]{40}$/);
  });
  it("never expands ${{ }} inside a run script", () => {
    const runs = [...code.matchAll(/run: ([\s\S]*?)(?=\n\s{0,8}- name:|\n\s*$|$)/g)].map((m) => m[1]);
    for (const r of runs) expect(r).not.toContain("${{");
  });
  it("runs weekly and on demand without persisting credentials", () => {
    expect(code).toContain('cron: "23 7 * * 1"');
    expect(code).toContain("workflow_dispatch:");
    expect(code).toContain("persist-credentials: false");
  });
});
