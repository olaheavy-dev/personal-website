import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the one h1 and the intro, with no eyebrow unless given", () => {
    const { container } = render(<PageHeader title="Work" intro="Intro." />);
    expect(screen.getByRole("heading", { level: 1, name: "Work" })).toBeInTheDocument();
    expect(screen.getByText("Intro.")).toBeInTheDocument();
    expect(container.querySelector("p.label-mono")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).className).toBe("text-display-lg leading-display");
  });
  it("shows an eyebrow above the title when given", () => {
    render(<PageHeader title="Lab" eyebrow="Projects" />);
    expect(screen.getByText("Projects")).toBeInTheDocument();
    // A space between the classes (they once ran together as "mt-4text-display-lg").
    expect(screen.getByRole("heading", { level: 1 }).className.split(" ")).toEqual([
      "mt-4",
      "text-display-lg",
      "leading-display",
    ]);
  });
});
