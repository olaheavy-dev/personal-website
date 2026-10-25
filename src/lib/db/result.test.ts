import { attempt, success } from "./result";

describe("attempt", () => {
  it("turns a thrown error into a failed result", async () => {
    const result = await attempt(async () => {
      throw new Error("network down");
    });
    expect(result).toEqual({ ok: false, reason: "query_failed", message: "network down" });
  });

  it("handles a thrown value that is not an Error", async () => {
    const result = await attempt(async () => {
      throw "oops";
    });
    expect(result).toMatchObject({ ok: false, reason: "query_failed" });
  });

  it("returns a normal result unchanged", async () => {
    expect(await attempt(async () => success(1))).toEqual({ ok: true, data: 1 });
  });
});
