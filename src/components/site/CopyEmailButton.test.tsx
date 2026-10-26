import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { site } from "@/lib/site";
import { CopyEmailButton } from "./CopyEmailButton";
import { ToastProvider } from "./Toast";

function renderButton() {
  render(
    <ToastProvider>
      <CopyEmailButton />
    </ToastProvider>,
  );
}

const copyButton = () => screen.getByRole("button", { name: "Copy email" });
// The toast provider has a status region of its own; ours is found by test id.
const status = () => screen.getByTestId("copy-email-status");

describe("CopyEmailButton", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("copies the address, shows Copied and announces it, then goes back", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderButton();
    expect(status()).toBeEmptyDOMElement();
    await user.click(copyButton());
    await act(async () => {});
    expect(writeText).toHaveBeenCalledWith(site.email);
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(status()).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(status()).toHaveTextContent("Email copied");
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(copyButton()).toBeInTheDocument();
  });

  it("empties the status on every click and writes the message again after a pause", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderButton();
    await user.click(copyButton());
    await act(async () => {});
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(status()).toHaveTextContent("Email copied");
    await user.click(screen.getByRole("button", { name: "Copied" }));
    await act(async () => {});
    expect(status()).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(status()).toHaveTextContent("Email copied");
  });

  it("does not set state when unmounted while the copy is pending", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let resolve!: () => void;
    vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(new Promise<void>((r) => (resolve = r)));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { unmount } = render(<CopyEmailButton />);
    await user.click(copyButton());
    unmount();
    await act(async () => {
      resolve();
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(error).not.toHaveBeenCalled();
  });

  it("restarts the timer on a repeated click", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderButton();
    await user.click(copyButton());
    await act(async () => {});
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    await user.click(screen.getByRole("button", { name: "Copied" }));
    await act(async () => {});
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(copyButton()).toBeInTheDocument();
  });

  it("keeps both labels in the button so its width never changes", async () => {
    renderButton();
    const button = copyButton();
    expect(button).toHaveTextContent("Copy email");
    expect(button).toHaveTextContent("Copied");
  });

  it("clears the timer on unmount", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const { unmount } = render(<CopyEmailButton />);
    await user.click(copyButton());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderButton();
    await user.tab();
    expect(copyButton()).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(writeText).toHaveBeenCalledTimes(2);
  });

  it("shows the address as selectable text and moves focus to it when copying is refused", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    renderButton();
    await user.click(copyButton());
    // The refused promise can settle after the click returns (slow CI): let it settle first.
    await act(async () => {});
    expect(screen.queryByRole("button", { name: /Cop/ })).toBeNull();
    const address = screen.getByText(site.email);
    expect(address).toHaveClass("select-all", "font-mono", "break-all");
    expect(address).toHaveFocus();
    expect(screen.getByText("Copy it from here")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(status()).toHaveTextContent("Select the address to copy it");
  });

  it("does the same when the Clipboard API is missing", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderButton();
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue(undefined as unknown as Clipboard);
    await user.click(copyButton());
    await act(async () => {});
    expect(screen.getByText(site.email)).toHaveFocus();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(status()).toHaveTextContent("Select the address to copy it");
  });

  it("shows no toast: only our status region has text", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderButton();
    await user.click(copyButton());
    await act(async () => {});
    act(() => {
      vi.advanceTimersByTime(150);
    });
    const withText = screen.getAllByRole("status").filter((region) => region.textContent?.trim());
    expect(withText).toHaveLength(1);
    expect(withText[0]!).toHaveTextContent("Email copied");
  });
});
