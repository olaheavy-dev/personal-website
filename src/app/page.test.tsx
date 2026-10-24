import { render, screen, within } from "@testing-library/react";
import Home from "./page";

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
      .map((item) => item.textContent?.replace(/^\d+/, "").match(/^[A-Z][a-z]+/)?.[0]);
    expect(names).toEqual(["Idea", "Design", "Build", "Ship", "Scale"]);
  });
});
