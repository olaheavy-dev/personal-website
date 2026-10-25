import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { pageRegistry } from "@/lib/flags/registry";
import { MobileMenu, PillNav } from "./PillNav";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const items = pageRegistry;
const withoutLab = pageRegistry.filter((item) => item.href !== "/lab");

describe("PillNav", () => {
  it("links to the five sections and marks the current one", () => {
    navigation.pathname = "/lab";
    render(<PillNav items={items} />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Work", "Lab", "Writing", "Travel", "About"]);
    expect(within(nav).getByRole("link", { name: "Lab" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Work" })).not.toHaveAttribute("aria-current");
  });

  it("marks nothing on the home page", () => {
    navigation.pathname = "/";
    render(<PillNav items={items} />);
    expect(screen.queryByRole("link", { current: "page" })).toBeNull();
  });

  it("marks nothing on an unknown sub-page (closes #87)", () => {
    navigation.pathname = "/work/nope";
    render(<PillNav items={items} />);
    expect(screen.queryByRole("link", { current: "page" })).toBeNull();
  });

  it("lists only the items it is given, with no gap", () => {
    navigation.pathname = "/";
    render(<PillNav items={withoutLab} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Work",
      "Writing",
      "Travel",
      "About",
    ]);
  });

  it("renders no landmark at all when every section is hidden", () => {
    navigation.pathname = "/";
    const { container } = render(<PillNav items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("MobileMenu", () => {
  it("opens and closes with the button, and Escape returns focus to it", async () => {
    navigation.pathname = "/";
    const user = userEvent.setup();
    render(<MobileMenu items={items} />);
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

  it("lists only the visible items", async () => {
    navigation.pathname = "/";
    const user = userEvent.setup();
    render(<MobileMenu items={withoutLab} />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(within(screen.getByRole("navigation", { name: "Main" })).getAllByRole("link")).toHaveLength(4);
  });

  it("renders no Menu button and no landmark when every section is hidden", () => {
    navigation.pathname = "/";
    const { container } = render(<MobileMenu items={[]} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("navigation", { hidden: true })).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
