import { render, screen } from "@testing-library/react";
import { TicketAreas } from "./TicketAreas";

describe("TicketAreas", () => {
  it("shows the areas joined by a middle dot and says them with commas", () => {
    const { container } = render(<TicketAreas areas={["AI", "Data & IoT"]} />);
    expect(container.querySelector("[aria-hidden='true']")!.textContent).toBe("AI · Data & IoT");
    expect(screen.getByText("Areas: AI, Data & IoT")).toHaveClass("sr-only");
  });

  it("is plain text: no link, no button, nothing focusable", () => {
    const { container } = render(<TicketAreas areas={["Edtech"]} />);
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
  });

  it("renders nothing without areas", () => {
    const { container } = render(<TicketAreas areas={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
