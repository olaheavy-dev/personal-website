import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the one h1 and the intro, with no eyebrow unless given", () => {
    const { container } = render(<PageHeader title="Work" intro="Intro." />);
    expect(screen.getByRole("heading", { level: 1, name: "Work" })).toBeInTheDocument();
    expect(screen.getByText("Intro.")).toBeInTheDocument();
    expect(container.querySelector("p.label-mono")).toBeNull();
  });
  it("shows an eyebrow above the title when given", () => {
    render(<PageHeader title="Lab" eyebrow="Projects" />);
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });
});
