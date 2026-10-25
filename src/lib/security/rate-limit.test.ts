import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows the limit and refuses the next call in the same window", () => {
    const allow = createRateLimiter(3, 60_000);
    expect([1, 2, 3, 4, 5].map(() => allow("a", 0))).toEqual([true, true, true, false, false]);
  });

  it("counts each key separately", () => {
    const allow = createRateLimiter(1, 60_000);
    expect(allow("a", 0)).toBe(true);
    expect(allow("b", 0)).toBe(true);
    expect(allow("a", 1)).toBe(false);
  });

  it("starts a new window when the old one has ended", () => {
    const allow = createRateLimiter(1, 60_000);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 59_999)).toBe(false);
    expect(allow("a", 60_000)).toBe(true);
  });
});
