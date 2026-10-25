import { render, screen, within } from "@testing-library/react";
import Home from "./page";

// Selected stops is an async server component that reads the cached database queries; its own
// tests are in components/home/SelectedStops.test.tsx. Here it only has to sit in the right place.
vi.mock("@/components/home/SelectedStops", () => ({
  SelectedStops: () => <section aria-label="Selected stops" />,
}));

describe("Home", () => {
  it("has one main heading that names the owner and the positioning line", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/Hi, I.m\s*Sunkanmi/);
    expect(heading).toHaveTextContent(/from idea\s*to production, with AI built in\./);
  });

  it("offers the email call to action inside the hero", () => {
    render(<Home />);
    const hero = screen.getByRole("region", { name: /Hi, I.m/ });
    expect(within(hero).getByRole("link", { name: /Email me/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:.+@.+/),
    );
  });

  it("cites a public source for the HBK ticket", () => {
    render(<Home />);
    const source = screen.getByRole("link", { name: /Release notes/ });
    expect(source).toHaveAttribute("href", expect.stringContaining("hbkworld.com"));
    expect(source).toHaveAttribute("target", "_blank");
    expect(source).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("lists the five journey stations in order", () => {
    render(<Home />);
    const route = screen.getByRole("region", { name: /The route, every time/ });
    const names = within(route)
      .getAllByRole("listitem")
      .map((item) => item.textContent?.match(/^[A-Z][a-z]+/)?.[0]);
    expect(names).toEqual(["Idea", "Design", "Build", "Ship", "Scale"]);
  });

  it("does not number the stations", () => {
    render(<Home />);
    const route = screen.getByRole("region", { name: /The route, every time/ });
    expect(route).not.toHaveTextContent(/\d/);
  });

  it("describes how each station adds value rather than listing the stack", () => {
    render(<Home />);
    const route = screen.getByRole("region", { name: /The route, every time/ });
    expect(within(route).getByText(/human-centred AI built in/)).toBeInTheDocument();
    expect(within(route).getByText(/usability testing/)).toBeInTheDocument();
    expect(within(route).getByText(/user feedback and continuous evaluation/)).toBeInTheDocument();
    expect(route).not.toHaveTextContent(/\.NET|Python|TypeScript/);
  });

  it("puts the logo rail between the hero and the journey stations", () => {
    render(<Home />);
    const hero = screen.getByRole("region", { name: /Hi, I.m/ });
    const rail = screen.getByRole("region", { name: "Where I've shipped" });
    const route = screen.getByRole("region", { name: /The route, every time/ });
    expect(hero.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rail.compareDocumentPosition(route) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("puts Selected stops after the journey stations", () => {
    render(<Home />);
    const route = screen.getByRole("region", { name: /The route, every time/ });
    const stops = screen.getByRole("region", { name: "Selected stops" });
    expect(route.compareDocumentPosition(stops) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
