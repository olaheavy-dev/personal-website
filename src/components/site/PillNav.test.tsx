import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileMenu, PillNav } from "./PillNav";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

describe("PillNav", () => {
  it("links to the five sections and marks the current one", () => {
    navigation.pathname = "/lab";
    render(<PillNav />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Work", "Lab", "Writing", "Travel", "About"]);
    expect(within(nav).getByRole("link", { name: "Lab" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Work" })).not.toHaveAttribute("aria-current");
  });

  it("marks nothing on the home page", () => {
    navigation.pathname = "/";
    render(<PillNav />);
    expect(screen.queryByRole("link", { current: "page" })).toBeNull();
  });
});

describe("MobileMenu", () => {
  it("opens and closes with the button, and Escape returns focus to it", async () => {
    navigation.pathname = "/";
    const user = userEvent.setup();
    render(<MobileMenu />);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation")).toBeNull();

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(within(screen.getByRole("navigation", { name: "Main" })).getAllByRole("link")).toHaveLength(5);

    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
});
