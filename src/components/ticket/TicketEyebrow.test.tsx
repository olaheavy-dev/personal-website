import { render, screen } from "@testing-library/react";
import { TicketEyebrow } from "./TicketEyebrow";

describe("TicketEyebrow", () => {
  it("puts the role over the meta line, with real spaces and no dot between them", () => {
    const { container } = render(
      <TicketEyebrow role="Senior Software Engineer" meta="via Deimos · 2022 to 2024" />,
    );
    expect(screen.getByText("Senior Software Engineer")).toHaveClass("block");
    expect(screen.getByText("via Deimos · 2022 to 2024")).toHaveClass("block", "whitespace-nowrap");
    expect(container.textContent).not.toContain("\u00a0");
  });

  it("reads as one natural phrase to a screen reader", () => {
    const { container } = render(
      <TicketEyebrow role="Senior Software Engineer" meta="via Deimos · 2022 to 2024" />,
    );
    expect(container.textContent).toBe("Senior Software Engineer, via Deimos · 2022 to 2024");
  });

  it("shows the years line only when there is no role", () => {
    const { container } = render(<TicketEyebrow role={null} meta="2018 to 2021" />);
    expect(container.textContent).toBe("2018 to 2021");
  });
});
