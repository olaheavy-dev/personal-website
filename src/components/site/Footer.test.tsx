import { render, screen, within } from "@testing-library/react";
import { site } from "@/lib/site";
import { Footer } from "./Footer";
import { ToastProvider } from "./Toast";

function renderFooter() {
  return render(
    <ToastProvider>
      <Footer />
    </ToastProvider>,
  );
}

describe("Footer", () => {
  it("ends the route with a next stop and both contact actions", () => {
    renderFooter();
    expect(screen.getByRole("heading", { level: 2, name: "Yours." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Email me/ })).toHaveAttribute("href", `mailto:${site.email}`);
    expect(screen.getByRole("button", { name: "Copy email" })).toBeInTheDocument();
  });

  it("does not repeat the one-liner or the section links from the header", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");
    expect(footer).not.toHaveTextContent(site.oneLiner);
    expect(within(footer).queryByRole("link", { name: "Work" })).toBeNull();
  });

  it("ends the route at Scale instead of numbering a sixth stop", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");
    expect(footer).not.toHaveTextContent(/Stop\s*06/);
    expect(within(footer).getByText("Availability")).toBeInTheDocument();
  });

  it("shows the profiles inside the ticket, each opening in a new tab", () => {
    renderFooter();
    const ticket = screen.getByRole("region", { name: "Yours." });
    const profiles = within(ticket).getByRole("list", { name: "Profiles" });
    expect(within(profiles).getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/olaheavy-dev",
    );
    for (const name of [/LinkedIn/, /Hashnode/, /^X/]) {
      expect(within(profiles).getByRole("link", { name })).toHaveAttribute("target", "_blank");
    }
  });
});
