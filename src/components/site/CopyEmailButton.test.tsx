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
    expect(writeText).toHaveBeenCalledWith(site.email);
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(status()).toHaveTextContent("Email copied");
    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(copyButton()).toBeInTheDocument();
  });

  it("announces again on every click by remounting the message", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderButton();
    await user.click(copyButton());
    const first = status().firstElementChild;
    expect(first).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Copied" }));
    const second = status().firstElementChild;
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
    expect(status()).toHaveTextContent("Email copied");
  });

  it("restarts the timer on a repeated click", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderButton();
    await user.click(copyButton());
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    await user.click(screen.getByRole("button", { name: "Copied" }));
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
    expect(screen.queryByRole("button", { name: /Cop/ })).toBeNull();
    const address = screen.getByText(site.email);
    expect(address).toHaveClass("select-all", "font-mono", "break-all");
    expect(address).toHaveFocus();
    expect(status()).toHaveTextContent("Select the address to copy it");
  });

  it("does the same when the Clipboard API is missing", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderButton();
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue(undefined as unknown as Clipboard);
    await user.click(copyButton());
    expect(screen.getByText(site.email)).toHaveFocus();
    expect(status()).toHaveTextContent("Select the address to copy it");
  });

  it("shows no toast: only our status region has text", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderButton();
    await user.click(copyButton());
    const withText = screen.getAllByRole("status").filter((region) => region.textContent?.trim());
    expect(withText).toHaveLength(1);
    expect(withText[0]!).toHaveTextContent("Email copied");
  });
});
