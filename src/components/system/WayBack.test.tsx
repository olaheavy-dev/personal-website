import { render, screen, within } from "@testing-library/react";
import { navItems, wayBackLinks } from "@/lib/nav";
import { WayBack } from "./WayBack";

const withoutWork = navItems.filter((item) => item.href !== "/work");

describe("wayBackLinks", () => {
  it("criterion 10: offers Home and Work, and drops Work when it is not in the navigation", () => {
    expect(wayBackLinks().map((link) => link.href)).toEqual(["/", "/work"]);
    expect(wayBackLinks(withoutWork).map((link) => link.href)).toEqual(["/"]);
  });
});

describe("WayBack", () => {
  it("criterion 8: lists You are here, then Home and Work as real links", () => {
    render(<WayBack />);
    const list = screen.getByRole("list", { name: "The way back" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("You are here");
    expect(within(items[0]!).queryByRole("link")).toBeNull();
    expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Work/ })).toHaveAttribute("href", "/work");
  });

  it("criterion 10: without Work it renders You are here and Home only, with no trailing leg", () => {
    const { container } = render(<WayBack items={withoutWork} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: /Work/ })).toBeNull();
    // One leg only: from You are here to Home. The last stop has none after it.
    expect(container.querySelectorAll("[data-route-leg]")).toHaveLength(1);
  });

  it("puts the paper plane on the first leg only", () => {
    const { container } = render(<WayBack />);
    const legs = container.querySelectorAll("[data-route-leg]");
    expect(legs).toHaveLength(2);
    expect(legs[0]!.querySelector(".route-plane")).not.toBeNull();
    expect(legs[1]!.querySelector(".route-plane")).toBeNull();
  });
});
