import { workCopy } from "./copy";

// The owner approved these words on 27 Oct 2026 (issue #10); a change here is a content decision.
describe("workCopy", () => {
  it("is the approved wording, word for word", () => {
    expect(workCopy.h1).toBe("Work");
    expect(workCopy.eyebrow).toBe("Work");
    expect(workCopy.intro).toBe(
      "Seven roles across IoT, banking, cross-border payments, edtech and AI, newest first.",
    );
    expect(workCopy.metaDescription).toBe(
      "Seven roles of production software across banking, cross-border payments, edtech, IoT and AI, from Galooli to HBK.",
    );
    expect(workCopy.failure.line).toBe(
      "The work list isn't loading right now. The highlights are on the home page.",
    );
    expect(workCopy.failure.href).toBe("/");
    expect(workCopy.lab).toEqual({
      heading: "In the lab",
      line: "Personal projects built end to end, from idea to production.",
    });
  });

  it("keeps the meta description short enough for a search result", () => {
    expect(workCopy.metaDescription.length).toBeLessThanOrEqual(160);
  });
});
