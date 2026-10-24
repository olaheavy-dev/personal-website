import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";

function mockSystemTheme(dark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: dark && query.includes("dark"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("switches from the system light theme to dark and remembers the choice", async () => {
    mockSystemTheme(false);
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: "Toggle colour theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("switches from the system dark theme to light", async () => {
    mockSystemTheme(true);
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: "Toggle colour theme" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("flips an explicit choice back and forth", async () => {
    mockSystemTheme(false);
    document.documentElement.setAttribute("data-theme", "dark");
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Toggle colour theme" });
    await userEvent.click(button);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    await userEvent.click(button);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
