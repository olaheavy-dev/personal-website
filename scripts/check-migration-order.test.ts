import { findOrderProblems } from "./check-migration-order.mjs";

const main = ["20261025100000_a.sql", "20261026132128_b.sql"];

describe("check-migration-order", () => {
  it("accepts a new migration newer than main's newest", () => {
    expect(findOrderProblems(main, [...main, "20261027090000_c.sql"])).toEqual([]);
  });

  it("accepts a branch with no new migration", () => {
    expect(findOrderProblems(main, main)).toEqual([]);
  });

  it("rejects a new migration older than main's newest", () => {
    const problems = findOrderProblems(main, [...main, "20261026000000_late.sql"]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("20261026000000_late.sql");
  });

  it("rejects a new migration with the same timestamp as main's newest", () => {
    expect(findOrderProblems(main, [...main, "20261026132128_twin.sql"])).toHaveLength(1);
  });

  it("rejects a badly named file", () => {
    expect(findOrderProblems(main, [...main, "later.sql"])).toHaveLength(1);
  });

  it("does not flag a branch that is behind main", () => {
    expect(findOrderProblems(main, ["20261025100000_a.sql"])).toEqual([]);
  });
});
