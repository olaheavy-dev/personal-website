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
    const link = screen.getByRole("link", {
      name: "1M+ Google Play downloads (source: Google Play listing, opens in a new tab)",
    });
    expect(link).toHaveAttribute("href", source.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveClass("min-h-11");
    expect(screen.queryByRole("button")).toBeNull();
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

  it("never splits the figure, keeps the label's last word with its arrow, and the credit beside the link", () => {
    render(<MetricChip value="17M+" label="customers served" source={source} attribution="Mukuru" />);
    expect(screen.getByText("17M+")).toHaveClass("whitespace-nowrap");
    const credit = screen.getByText("(Mukuru)");
    expect(credit).toHaveClass("whitespace-nowrap", "text-text-secondary");
    expect(credit.closest("a")).toBeNull();
    const lastWord = screen.getByRole("link").querySelector("svg")!.parentElement!;
    expect(lastWord).toHaveClass("whitespace-nowrap");
    expect(lastWord).toHaveTextContent(/^served/);
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
