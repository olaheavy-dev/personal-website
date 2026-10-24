import { render, screen } from "@testing-library/react";
import { AvailabilityChip } from "./AvailabilityChip";

describe("AvailabilityChip", () => {
  afterEach(() => vi.useRealTimers());

  it("shows availability and the current UK time in 24-hour format", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 14:05 UTC on a winter date is 14:05 in the UK.
    vi.setSystemTime(new Date("2026-01-15T14:05:00Z"));
    render(<AvailabilityChip />);
    expect(screen.getByText(/Open to senior & staff AI roles/)).toBeInTheDocument();
    expect(screen.getByText("14:05")).toBeInTheDocument();
  });

  it("follows British Summer Time", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-15T14:05:00Z"));
    render(<AvailabilityChip />);
    expect(screen.getByText("15:05")).toBeInTheDocument();
  });
});
