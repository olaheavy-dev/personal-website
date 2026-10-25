import { render, screen, within } from "@testing-library/react";
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
  return screen.getByRole("button", { name: "Copy email" });
}

// The toast provider has a status region of its own; ours is found by test id.
function passRegion() {
  return screen.getByTestId("copy-email-status");
}

describe("CopyEmailButton", () => {
  afterEach(() => vi.restoreAllMocks());

  it("prints a boarding pass and announces it (criterion 12)", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await user.click(renderButton());
    expect(writeText).toHaveBeenCalledWith(site.email);
    const region = passRegion();
    expect(region).toHaveTextContent(`Email copied, ${site.email}`);
    expect(within(region).getByText("Next stop: your email")).toBeInTheDocument();
    expect(within(region).getByText(site.email)).toBeInTheDocument();
  });

  it("still shows the address when copying is refused (criterion 13)", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    await user.click(renderButton());
    expect(passRegion()).toHaveTextContent(`Select to copy, ${site.email}`);
    expect(screen.getByText(site.email)).toBeInTheDocument();
  });

  it("still shows the address when the Clipboard API is missing (criterion 13)", async () => {
    const user = userEvent.setup();
    const button = renderButton();
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue(undefined as unknown as Clipboard);
    await user.click(button);
    expect(passRegion()).toHaveTextContent(`Select to copy, ${site.email}`);
    expect(screen.getByText(site.email)).toBeInTheDocument();
  });

  it("always renders the status region, empty before the first click (criterion 14)", () => {
    renderButton();
    const region = passRegion();
    expect(region).toBeEmptyDOMElement();
    expect(screen.queryByText(site.email)).toBeNull();
  });

  it("reprints a fresh pass on every click so it is announced again (criterion 15)", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const button = renderButton();
    await user.click(button);
    const first = passRegion().firstElementChild;
    expect(first).not.toBeNull();
    await user.click(button);
    const second = passRegion().firstElementChild;
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
    expect(passRegion()).toHaveTextContent(`Email copied, ${site.email}`);
  });

  it("shows no toast: the toast region stays empty (criterion 16)", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await user.click(renderButton());
    const regions = screen.getAllByRole("status");
    const withText = regions.filter((region) => region.textContent?.trim());
    expect(withText).toHaveLength(1);
    expect(withText[0]!).toHaveTextContent("Email copied");
  });
});
