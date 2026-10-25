import { render, screen } from "@testing-library/react";
import { MetricChip } from "./MetricChip";

const source = {
  kind: "link" as const,
  label: "Google Play listing",
  url: "https://play.google.com/store/apps/details?id=example",
};

describe("MetricChip", () => {
  it("shows the figure and a source button whose name says source", () => {
    render(<MetricChip value="1M+" label="Google Play downloads" source={source} />);
    expect(screen.getByText("1M+")).toBeInTheDocument();
    expect(screen.getAllByText(/Google Play downloads/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Source for 1M+ Google Play downloads" })).toBeInTheDocument();
  });

  it("wires the button to a native popover that links to the source", () => {
    const { container } = render(<MetricChip value="1M+" label="Google Play downloads" source={source} />);
    const button = screen.getByRole("button", { name: /Source for/ });
    const popover = container.querySelector("[popover]") as HTMLElement;
    expect(popover).toHaveAttribute("popover", "auto");
    expect(button).toHaveAttribute("popovertarget", popover.id);
    const link = popover.querySelector("a") as HTMLAnchorElement;
    expect(link).toHaveTextContent("Google Play listing");
    expect(link).toHaveAttribute("href", source.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("gives the sheet a close button on phones", () => {
    const { container } = render(<MetricChip value="1M+" label="downloads" source={source} />);
    const popover = container.querySelector("[popover]") as HTMLElement;
    const close = popover.querySelector("button") as HTMLButtonElement;
    expect(close).toHaveAttribute("popovertargetaction", "hide");
    expect(close).toHaveAttribute("popovertarget", popover.id);
  });

  it("shows an own measurement as text, with no link", () => {
    const { container } = render(
      <MetricChip
        value="98"
        label="Lighthouse performance"
        source={{ kind: "own", note: "Mobile, 12 May 2026" }}
      />,
    );
    const popover = container.querySelector("[popover]") as HTMLElement;
    expect(popover).toHaveTextContent("Own measurement.");
    expect(popover).toHaveTextContent("Mobile, 12 May 2026");
    expect(popover.querySelector("a")).toBeNull();
  });

  it.each([
    ["90+", "Optty", 2023, "(Optty, 2023)"],
    ["1M+", "Google Play", null, "(Google Play)"],
    ["1M+", "Google Play", 2026, "(Google Play, 2026)"],
    ["R2025X", "HBK", 2025, "(HBK, 2025)"],
    ["2025 R4", "HBK", 2025, "(HBK)"],
  ])("credits the claim: %s %s %s shows %s", (value, attribution, year, shown) => {
    render(<MetricChip value={value} label="things" source={source} attribution={attribution} year={year} />);
    expect(screen.getByText(shown)).toBeInTheDocument();
  });

  it("shows the day a link source was checked in the popover, and nothing for an own measurement", () => {
    const { container, rerender } = render(
      <MetricChip value="1M+" label="downloads" source={source} checkedOn="2026-10-05" />,
    );
    expect(container.querySelector("[popover]")).toHaveTextContent("Checked 5 Oct 2026");
    rerender(
      <MetricChip value="98" label="score" source={{ kind: "own", note: "Mobile" }} checkedOn="2026-10-05" />,
    );
    expect(container.querySelector("[popover]")).not.toHaveTextContent("Checked");
  });

  it("shows no credit for a claim without an attribution", () => {
    render(
      <MetricChip value="17" label="evaluation suites" source={source} attribution={null} year={2026} />,
    );
    expect(screen.queryByText(/^\((?!opens)/)).toBeNull();
  });

  it("never splits the figure or its credit across lines", () => {
    render(<MetricChip value="2025 R4" label="launch" source={source} attribution="Optty" year={2023} />);
    expect(screen.getByText("2025 R4")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("(Optty, 2023)")).toHaveClass("whitespace-nowrap");
  });

  it("does not compile without a source", () => {
    // The claims policy in code: a figure can not be shown without where it is from.
    // @ts-expect-error `source` is required
    const chip = <MetricChip value="1M+" label="downloads" />;
    expect(chip).toBeTruthy();
  });

  it("does not compile with an unlabelled source", () => {
    // @ts-expect-error a link source needs a label and url; an own source needs a note
    const chip = <MetricChip value="1M+" label="downloads" source={{ kind: "own" }} />;
    expect(chip).toBeTruthy();
  });
});
