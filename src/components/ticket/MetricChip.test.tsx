import { render, screen } from "@testing-library/react";
import { MetricChip } from "./MetricChip";

const source = {
  kind: "link" as const,
  label: "Google Play listing",
  url: "https://play.google.com/store/apps/details?id=example",
};

describe("MetricChip", () => {
  it("makes the figure a link to its source, in a new tab, named for screen readers", () => {
    render(<MetricChip value="1M+" label="Google Play downloads" source={source} />);
    // jsdom drops the space at the end of an inline element; Chrome keeps it (checked with an
    // aria snapshot), so the pattern allows both.
    const link = screen.getByRole("link", {
      name: /^1M\+ Google Play ?downloads \(source: Google Play listing, opens in a new tab\)$/,
    });
    expect(link).toHaveAttribute("href", source.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveClass("min-h-11");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("puts the visible credit before the hidden source text in the accessible name", () => {
    render(<MetricChip value="17M+" label="customers served" source={source} attribution="Mukuru" />);
    expect(
      screen.getByRole("link", {
        name: /^17M\+ customers ?served \(Mukuru\) \(source: Google Play listing, opens in a new tab\)$/,
      }),
    ).toBeInTheDocument();
  });

  it("shows an own measurement as plain text with no link", () => {
    const { container } = render(
      <MetricChip
        value="98"
        label="Lighthouse performance"
        source={{ kind: "own", note: "Mobile, 12 May 2026" }}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(container).toHaveTextContent("98 Lighthouse performance");
    expect(screen.getByText("(own measurement)")).toBeInTheDocument();
  });

  it.each([
    ["90+", "Optty", "(Optty)"],
    ["1M+", "Google Play", "(Google Play)"],
    ["17M+", "Mukuru", "(Mukuru)"],
  ])("credits the claim without a year: %s %s shows %s", (value, attribution, shown) => {
    render(<MetricChip value={value} label="things" source={source} attribution={attribution} />);
    expect(screen.getByText(shown)).toBeInTheDocument();
    expect(screen.queryByText(/^\(.*\d{4}/)).toBeNull();
  });

  it("shows no credit for a claim without an attribution", () => {
    render(<MetricChip value="17" label="evaluation suites" source={source} attribution={null} />);
    expect(screen.queryByText(/^\((?!source)/)).toBeNull();
  });

  it("never splits the figure, and keeps the last word, the arrow and the credit together", () => {
    render(<MetricChip value="17M+" label="customers served" source={source} attribution="Mukuru" />);
    expect(screen.getByText("17M+")).toHaveClass("whitespace-nowrap");
    const credit = screen.getByText("(Mukuru)");
    expect(credit).toHaveClass("whitespace-nowrap", "text-text-secondary");
    // inline-block keeps the link's underline off the credit.
    expect(credit).toHaveClass("inline-block");
    const together = credit.parentElement!;
    expect(together).toHaveClass("whitespace-nowrap");
    expect(together).toContainElement(screen.getByRole("link").querySelector("svg"));
    expect(together).toHaveTextContent(/^served \(Mukuru\)/);
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
