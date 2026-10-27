import { findImageProblems } from "./check-playwright-image.mjs";

const a = `mcr.microsoft.com/playwright@sha256:${"a".repeat(64)}`;
const b = `mcr.microsoft.com/playwright@sha256:${"b".repeat(64)}`;

describe("check-playwright-image", () => {
  it("accepts the same digest in every workflow", () => {
    expect(
      findImageProblems({
        "ci.yml": `image: ${a}\n image: ${a}`,
        "post-deploy-smoke.yml": `image: ${a}`,
      }),
    ).toEqual([]);
  });

  it("rejects a digest that differs in one workflow, naming both files", () => {
    const problems = findImageProblems({ "ci.yml": `image: ${a}`, "post-deploy-smoke.yml": `image: ${b}` });
    expect(problems.join("\n")).toContain("ci.yml");
    expect(problems.join("\n")).toContain("post-deploy-smoke.yml");
  });

  it("rejects digests that differ inside one file", () => {
    expect(findImageProblems({ "ci.yml": `image: ${a}\nimage: ${b}` }).length).toBeGreaterThan(0);
  });

  it("rejects workflows with no pinned image", () => {
    expect(findImageProblems({ "ci.yml": "runs-on: ubuntu-24.04" })).toHaveLength(1);
  });

  it("ignores other images", () => {
    expect(findImageProblems({ "ci.yml": `image: node:24\nimage: ${a}` })).toEqual([]);
  });
});
