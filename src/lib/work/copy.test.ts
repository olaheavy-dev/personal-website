import { workCopy } from "./copy";

// The owner approved these words on 27 Oct 2026 (issue #10); a change here is a content decision.
describe("workCopy", () => {
  it("is the approved wording, word for word", () => {
    expect(workCopy.h1).toBe("Work");
    expect("eyebrow" in workCopy).toBe(false);
    expect(workCopy.intro).toBe(
      "Where I have worked, newest first: AI and sensor-data analytics, cross-border payments, edtech, banking and IoT.",
    );
    expect(workCopy.metaDescription).toBe(
      "Where I have worked, from Galooli to HBK: AI and sensor-data analytics, cross-border payments, edtech, banking and IoT.",
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
