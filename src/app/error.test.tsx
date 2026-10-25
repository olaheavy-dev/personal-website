import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import ErrorPage from "./error";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("error.tsx", () => {
  it("criterion 25: never puts error.message in the page; the digest is the reference", () => {
    const error = Object.assign(new Error("internal detail"), { digest: "abc123" });
    const { container } = render(<ErrorPage error={error} retry={() => {}} />);
    expect(container.innerHTML).not.toContain("internal detail");
    expect(screen.getByText("Reference: abc123. Quote it if you email me.")).toBeInTheDocument();
  });

  it("handles a thrown value that is not an Error", () => {
    render(<ErrorPage error="a string" retry={() => {}} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("This page hit a problem");
    expect(screen.queryByText(/Reference:/)).toBeNull();
  });

  it("logs the error with console.error until reporting is wired (#55)", () => {
    const error = new Error("boom");
    render(<ErrorPage error={error} retry={() => {}} />);
    expect(console.error).toHaveBeenCalledWith(error);
  });
});
