import { workCopy } from "./copy";

// The owner approved these words on 27 Oct 2026 (issue #10); a change here is a content decision.
describe("workCopy", () => {
  it("is the approved wording, word for word", () => {
    expect(workCopy.h1).toBe("Work");
    expect("eyebrow" in workCopy).toBe(false);
    expect(workCopy.intro).toBe(
      "Technical and engineering roles across AI and engineering software, cross-border payments, edtech, banking and IoT, newest first.",
    );
    expect(workCopy.metaDescription).toBe(
      "Technical and engineering roles across AI and engineering software, cross-border payments, edtech, banking and IoT, from Galooli to HBK.",
    );
    const { before, link, after } = workCopy.failure;
    expect(before + link + after).toBe(
      "The work list isn't loading right now. The highlights are on the home page.",
    );
    expect(link).toBe("the home page");
    expect(workCopy.failure.href).toBe("/");
  });

  it("keeps the meta description short enough for a search result", () => {
    expect(workCopy.metaDescription.length).toBeLessThanOrEqual(160);
  });
});
