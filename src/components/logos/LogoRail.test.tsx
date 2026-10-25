import { render, screen, within } from "@testing-library/react";
import { LogoRail } from "./LogoRail";

describe("LogoRail", () => {
  it("is a labelled region with the heading", () => {
    render(<LogoRail />);
    const region = screen.getByRole("region", { name: "Where I've shipped" });
    expect(within(region).getByRole("heading", { level: 2 })).toHaveTextContent("Where I've shipped");
  });

  it("names every company in text, newest first, for screen readers", () => {
    render(<LogoRail />);
    const names = screen.getAllByRole("listitem").map((item) => item.textContent);
    // Outer items first, the group's own list items after it.
    expect(names).toContain("HBK");
    for (const name of ["Mukuru", "uLesson", "Optty", "Stanbic IBTC", "Access Bank", "Galooli"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    const read = screen.getByRole("region").textContent;
    expect(read!.indexOf("HBK")).toBeLessThan(read!.indexOf("Mukuru"));
    expect(read!.indexOf("Optty")).toBeLessThan(read!.indexOf("Stanbic IBTC"));
    expect(read!.indexOf("Stanbic IBTC")).toBeLessThan(read!.indexOf("Access Bank"));
    expect(read!.indexOf("Access Bank")).toBeLessThan(read!.indexOf("Galooli"));
  });

  it("groups the three Deimos clients under a 'via Deimos' label", () => {
    render(<LogoRail />);
    const group = screen.getByText("via").closest("li")!;
    expect(group).toHaveTextContent(/via\s*Deimos/);
    expect(
      within(group)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Mukuru", "uLesson", "Optty"]);
  });

  it("draws every mark as a decorative element with its file chosen in CSS, not inline", () => {
    const { container } = render(<LogoRail />);
    const marks = container.querySelectorAll("[data-logo]");
    expect(marks).toHaveLength(8);
    for (const mark of marks) {
      expect(mark).toHaveAttribute("aria-hidden", "true");
      expect(mark).not.toHaveAttribute("style");
    }
  });

  it("keeps list semantics on both lists", () => {
    const { container } = render(<LogoRail />);
    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(2);
    for (const list of lists) expect(list).toHaveAttribute("role", "list");
  });

  it("has nothing to focus: no links, buttons or tab stops", () => {
    const { container } = render(<LogoRail />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(container.querySelectorAll("[tabindex], a, button, input, img")).toHaveLength(0);
  });
});
