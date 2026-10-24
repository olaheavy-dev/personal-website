import { render, screen, within } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("shows only the profiles that are configured", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/olaheavy-dev",
    );
    expect(within(footer).queryByRole("link", { name: /LinkedIn|Hashnode|^X/ })).toBeNull();
    expect(within(footer).queryByRole("link", { name: /Résumé/ })).toBeNull();
  });

  it("links every section and the contact email", () => {
    render(<Footer />);
    const sections = screen.getByRole("navigation", { name: "Footer" });
    expect(within(sections).getAllByRole("link")).toHaveLength(5);
    expect(screen.getByRole("link", { name: /@/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/),
    );
  });
});
