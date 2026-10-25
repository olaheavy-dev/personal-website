import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorScreen } from "./ErrorScreen";

describe("ErrorScreen", () => {
  it("criterion 21: moves focus to the h1 when it appears", () => {
    render(<ErrorScreen onRetry={() => {}} />);
    expect(screen.getByRole("heading", { level: 1, name: "This page hit a problem" })).toHaveFocus();
  });

  it("shows the approved copy, a Try again button and a way home", () => {
    render(<ErrorScreen onRetry={() => {}} />);
    expect(screen.getByText("Service interrupted")).toBeInTheDocument();
    expect(
      screen.getByText("Something broke while loading it. Trying again usually fixes it."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the start" })).toHaveAttribute("href", "/");
  });

  it("criterion 25: shows the digest as the reference, and nothing when there is none", () => {
    const { rerender } = render(<ErrorScreen digest="1234567890" onRetry={() => {}} />);
    expect(screen.getByText("Reference: 1234567890. Quote it if you email me.")).toBeInTheDocument();
    rerender(<ErrorScreen onRetry={() => {}} />);
    expect(screen.queryByText(/Reference:/)).toBeNull();
  });

  it("calls onRetry when Try again is pressed", async () => {
    const onRetry = vi.fn();
    render(<ErrorScreen onRetry={onRetry} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("offers Email me only when standalone (global error has no header)", () => {
    const { rerender } = render(<ErrorScreen onRetry={() => {}} />);
    expect(screen.queryByRole("link", { name: /Email me/ })).toBeNull();
    rerender(<ErrorScreen onRetry={() => {}} standalone />);
    expect(screen.getByRole("link", { name: /Email me/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/),
    );
  });
});
