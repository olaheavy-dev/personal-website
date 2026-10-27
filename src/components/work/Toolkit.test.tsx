import { render, screen, within } from "@testing-library/react";
import { toolkitGroups, toolkitNotices } from "@/lib/toolkit";
import { Toolkit } from "./Toolkit";

describe("Toolkit", () => {
  it("is a section named Toolkit with six labelled lists", () => {
    render(<Toolkit />);
    const section = screen.getByRole("region", { name: "Toolkit" });
    expect(within(section).getByRole("heading", { level: 2, name: "Toolkit" })).toBeVisible();
    const lists = within(section).getAllByRole("list");
    expect(lists).toHaveLength(6);
    toolkitGroups.forEach((group, index) => {
      expect(within(section).getByRole("heading", { level: 3, name: group.name })).toBeVisible();
      const list = screen.getByRole("list", { name: group.name });
      expect(list).toBe(lists[index]);
      expect(within(list).getAllByRole("listitem")).toHaveLength(group.tools.length);
    });
  });

  it("shows all 37 names as text, with no intro, count or group number", () => {
    render(<Toolkit />);
    const names = toolkitGroups.flatMap((group) => group.tools.map((tool) => tool.name));
    expect(names).toHaveLength(37);
    for (const name of names) expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.queryByText(/\b37\b|tools$/i)).toBeNull();
    expect(screen.queryByText(/^0\d$/)).toBeNull();
  });

  it("hides every plate and icon from assistive technology, and gives logos empty alt text", () => {
    const { container } = render(<Toolkit />);
    const plates = container.querySelectorAll(".toolkit-plate");
    expect(plates).toHaveLength(37);
    plates.forEach((plate) => expect(plate).toHaveAttribute("aria-hidden", "true"));
    const logos = container.querySelectorAll("img");
    expect(logos).toHaveLength(10);
    logos.forEach((img) => expect(img).toHaveAttribute("alt", ""));
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("puts a notch pair on every divider and none above the first or after the last group", () => {
    const { container } = render(<Toolkit />);
    const groups = [...container.querySelectorAll(".toolkit-group")];
    expect(groups).toHaveLength(6);
    expect(groups[0]!.querySelectorAll(".toolkit-notch")).toHaveLength(0);
    for (const group of groups.slice(1)) {
      const notches = [...group.querySelectorAll(".toolkit-notch")];
      expect(notches.map((n) => n.getAttribute("data-side"))).toEqual(["left", "right"]);
      notches.forEach((n) => expect(n).toHaveAttribute("aria-hidden", "true"));
    }
  });

  it("shows the abbreviation on its plate and the full name as the chip text", () => {
    render(<Toolkit />);
    const item = screen.getByText("Amazon Web Services").closest("li")!;
    expect(within(item).getByText("AWS")).toHaveAttribute("aria-hidden", "true");
  });

  it("carries every trademark sentence under the ticket", () => {
    const { container } = render(<Toolkit />);
    const notice = container.querySelector("[data-toolkit-notice]")!;
    expect(notice).toBeVisible();
    for (const sentence of toolkitNotices) expect(notice.textContent).toContain(sentence);
  });

  it("shows a small trademark symbol right after Python and Redis", () => {
    const { container } = render(<Toolkit />);
    const marks = [...container.querySelectorAll("sup.toolkit-mark")];
    expect(marks.map((m) => m.textContent)).toEqual(["™", "®"]);
    expect(screen.getByText("Python").closest("li")).toHaveTextContent("Python™");
    expect(screen.getByText("Redis").closest("li")).toHaveTextContent("Redis®");
  });

  it("does not lazy load the logos", () => {
    const { container } = render(<Toolkit />);
    container.querySelectorAll("img").forEach((img) => expect(img).not.toHaveAttribute("loading"));
  });
});
