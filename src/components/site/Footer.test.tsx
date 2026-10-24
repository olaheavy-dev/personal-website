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
    expect(screen.getByRole("heading", { level: 2, name: "Your product." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Email me/ })).toHaveAttribute("href", `mailto:${site.email}`);
    expect(screen.getByRole("button", { name: "Copy email" })).toBeInTheDocument();
  });

  it("does not repeat the one-liner or the section links from the header", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");
    expect(footer).not.toHaveTextContent(site.oneLiner);
    expect(within(footer).queryByRole("link", { name: "Work" })).toBeNull();
  });

  it("shows only the profiles that are configured", () => {
    renderFooter();
    const profiles = screen.getByRole("list", { name: "Profiles" });
    expect(within(profiles).getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/olaheavy-dev",
    );
    expect(within(profiles).queryByRole("link", { name: /LinkedIn|Hashnode|^X/ })).toBeNull();
  });
});
