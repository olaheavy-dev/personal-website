import { render, screen } from "@testing-library/react";
import { TicketEyebrow } from "./TicketEyebrow";

describe("TicketEyebrow", () => {
  it("puts the role over the meta line, with real spaces and no dot between them", () => {
    const { container } = render(<TicketEyebrow role="Backend Software Engineer" meta="2024 to now" />);
    expect(screen.getByText("Backend Software Engineer")).toHaveClass("block");
    expect(screen.getByText("2024 to now")).toHaveClass("block", "whitespace-nowrap");
    expect(container.textContent).not.toContain("\u00a0");
  });

  it("reads as one natural phrase to a screen reader", () => {
    const { container } = render(<TicketEyebrow role="Backend Software Engineer" meta="2024 to now" />);
    expect(container.textContent).toBe("Backend Software Engineer, 2024 to now");
  });

  it("shows the years line only when there is no role", () => {
    const { container } = render(<TicketEyebrow role={null} meta="2018 to 2021" />);
    expect(container.textContent).toBe("2018 to 2021");
  });

  it("shows only 'via Deimos' for a Deimos client", () => {
    const { container } = render(<TicketEyebrow role={null} meta="via Deimos" />);
    expect(container.textContent).toBe("via Deimos");
  });

  it("can reserve two lines of height from a breakpoint so neighbouring titles line up", () => {
    const md = render(<TicketEyebrow role={null} meta="via Deimos" reserveFrom="md" />);
    expect(md.container.firstElementChild).toHaveClass("md:min-h-[2lh]");
    const lg = render(<TicketEyebrow role={null} meta="via Deimos" reserveFrom="lg" />);
    expect(lg.container.firstElementChild).toHaveClass("lg:min-h-[2lh]");
    expect(lg.container.firstElementChild).not.toHaveClass("md:min-h-[2lh]");
    expect(lg.container.textContent).toBe("via Deimos");
  });
});
