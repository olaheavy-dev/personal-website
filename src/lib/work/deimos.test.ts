import { deimosGroupHeading } from "./deimos";

const row = (more: Partial<Parameters<typeof deimosGroupHeading>[0][number]> = {}) => ({
  role: "Senior Software Engineer",
  via: "Deimos",
  startYear: 2022,
  endYear: 2024,
  ...more,
});

describe("deimosGroupHeading", () => {
  it("is the consultancy, the shared role and the span of the rows", () => {
    expect(deimosGroupHeading([row(), row(), row()])).toBe(
      "Deimos · Senior Software Engineer · 2022 to 2024",
    );
  });

  it("uses the earliest start and the latest end", () => {
    expect(
      deimosGroupHeading([row({ startYear: 2023, endYear: 2024 }), row({ startYear: 2022, endYear: 2023 })]),
    ).toBe("Deimos · Senior Software Engineer · 2022 to 2024");
  });

  it("says 'now' while any row is current", () => {
    expect(deimosGroupHeading([row(), row({ endYear: null })])).toBe(
      "Deimos · Senior Software Engineer · 2022 to now",
    );
  });

  it("falls back to 'Deimos' when the rows disagree on the role", () => {
    expect(deimosGroupHeading([row(), row({ role: "Technical Lead" })])).toBe("Deimos");
  });

  it("falls back to 'Deimos' when a row has no role", () => {
    expect(deimosGroupHeading([row({ role: null })])).toBe("Deimos");
  });

  it("falls back to 'Deimos' when the rows disagree on the consultancy, or there are none", () => {
    expect(deimosGroupHeading([row(), row({ via: "Other" })])).toBe("Deimos");
    expect(deimosGroupHeading([])).toBe("Deimos");
  });
});
