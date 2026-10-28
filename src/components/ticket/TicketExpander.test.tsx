import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketExpander } from "./TicketExpander";

afterEach(() => {
  window.location.hash = "";
});

describe("TicketExpander", () => {
  it("shows the aside beside the button, outside the collapsing region, closed or open", async () => {
    const user = userEvent.setup();
    render(<TicketExpander aside={<p>Aside text</p>}>Details</TicketExpander>);
    const button = screen.getByRole("button", { name: "Read more" });
    const aside = screen.getByText("Aside text");
    expect(aside.parentElement).toBe(button.parentElement);
    expect(aside.closest("[inert]")).toBeNull();
    await user.click(button);
    expect(screen.getByText("Aside text").closest("[inert]")).toBeNull();
  });

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

  it("opens on popstate (back and forward)", () => {
    render(<TicketExpander anchorId="mukuru">Details</TicketExpander>);
    act(() => {
      window.location.hash = "#mukuru";
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
  });

  describe("with the Navigation API", () => {
    const navigation = new EventTarget();
    beforeEach(() => {
      (window as unknown as { navigation: EventTarget }).navigation = navigation;
    });
    afterEach(() => {
      delete (window as unknown as { navigation?: EventTarget }).navigation;
    });

    it("opens on currententrychange", () => {
      render(<TicketExpander anchorId="mukuru">Details</TicketExpander>);
      act(() => {
        window.location.hash = "#mukuru";
        navigation.dispatchEvent(new Event("currententrychange"));
      });
      expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
    });

    it("stops listening when it unmounts", () => {
      const { unmount } = render(<TicketExpander anchorId="mukuru">Details</TicketExpander>);
      unmount();
      expect(() => navigation.dispatchEvent(new Event("currententrychange"))).not.toThrow();
    });
  });

  it("reopens when the URL points at it again after the visitor closed it", async () => {
    const user = userEvent.setup();
    window.location.hash = "#mukuru";
    render(<TicketExpander anchorId="mukuru">Details</TicketExpander>);
    await user.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.getByRole("button", { name: "Read more" })).toBeInTheDocument();
    // Same hash again (a link to the hash already in the URL): only the event fires.
    act(() => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
  });

  it("does not reopen for a hash that points elsewhere", async () => {
    const user = userEvent.setup();
    window.location.hash = "#mukuru";
    render(<TicketExpander anchorId="mukuru">Details</TicketExpander>);
    await user.click(screen.getByRole("button", { name: "Show less" }));
    act(() => {
      window.location.hash = "#other";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("button", { name: "Read more" })).toBeInTheDocument();
  });
});

describe("TicketExpander without JavaScript and with a subject", () => {
  it("names the button after what it expands, starting with the visible words", () => {
    render(<TicketExpander subject="Mukuru">Details</TicketExpander>);
    const button = screen.getByRole("button", { name: "Read more about Mukuru" });
    expect(button).toHaveTextContent("Read more");
  });

  it("keeps the plain name without a subject", () => {
    render(<TicketExpander>Details</TicketExpander>);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-label");
  });

  it("is not inert before hydration, so the server HTML can be read in full", async () => {
    const { renderToString } = await import("react-dom/server");
    const html = renderToString(<TicketExpander subject="Mukuru">Details</TicketExpander>);
    expect(html).not.toContain("inert");
    expect(html).toContain("ticket-expander-toggle");
    expect(html).not.toContain("data-hydrated");
  });

  it("marks itself hydrated and inert once closed in the browser", () => {
    render(<TicketExpander>Details</TicketExpander>);
    const button = screen.getByRole("button");
    const region = document.getElementById(button.getAttribute("aria-controls") as string)!;
    expect(region).toHaveAttribute("data-hydrated");
    expect(region.firstElementChild).toHaveAttribute("inert");
  });
});
