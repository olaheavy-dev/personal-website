import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketExpander } from "./TicketExpander";

afterEach(() => {
  window.location.hash = "";
});

describe("TicketExpander", () => {
  it("starts closed, with the content out of reach", () => {
    render(
      <TicketExpander anchorId="mukuru">
        <a href="https://example.com">Inside link</a>
      </TicketExpander>,
    );
    const button = screen.getByRole("button", { name: "Read more" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls");
    // inert keeps it out of the tab order and the accessibility tree (jsdom only shows the attribute).
    expect(screen.getByText("Inside link").parentElement).toHaveAttribute("inert");
  });

  it("toggles aria-expanded, the label and the content", async () => {
    const user = userEvent.setup();
    render(<TicketExpander>Details</TicketExpander>);
    const button = screen.getByRole("button", { name: "Read more" });
    const region = document.getElementById(button.getAttribute("aria-controls") as string);
    expect(region).not.toHaveAttribute("data-open");

    await user.click(button);
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
    expect(region).toHaveAttribute("data-open");

    await user.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.getByRole("button", { name: "Read more" })).toHaveAttribute("aria-expanded", "false");
    expect(region).not.toHaveAttribute("data-open");
  });

  it("opens when the URL hash matches its anchor", () => {
    window.location.hash = "#mukuru";
    render(<TicketExpander anchorId="mukuru">Details</TicketExpander>);
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
  });

  it("opens when the hash changes to its anchor later", () => {
    render(<TicketExpander anchorId="mukuru">Details</TicketExpander>);
    expect(screen.getByRole("button", { name: "Read more" })).toBeInTheDocument();
    act(() => {
      window.location.hash = "#mukuru";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
  });

  it("ignores a hash for a different anchor", () => {
    window.location.hash = "#other";
    render(<TicketExpander anchorId="mukuru">Details</TicketExpander>);
    expect(screen.getByRole("button", { name: "Read more" })).toBeInTheDocument();
  });
});
