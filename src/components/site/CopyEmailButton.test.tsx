import { render, screen } from "@testing-library/react";
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

describe("CopyEmailButton", () => {
  afterEach(() => vi.restoreAllMocks());

  it("copies the address, says so, and shows it", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await user.click(renderButton());
    expect(writeText).toHaveBeenCalledWith(site.email);
    expect(await screen.findByRole("status")).toHaveTextContent(`Email copied: ${site.email}`);
    expect(screen.getByText(site.email, { selector: "span" })).toBeInTheDocument();
  });

  it("still shows the address when copying is refused", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    await user.click(renderButton());
    expect(await screen.findByRole("status")).toHaveTextContent(`Email: ${site.email}`);
    expect(screen.getByText(site.email, { selector: "span" })).toBeInTheDocument();
  });

  it("still shows the address when the Clipboard API is missing", async () => {
    const user = userEvent.setup();
    const button = renderButton();
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue(undefined as unknown as Clipboard);
    await user.click(button);
    expect(await screen.findByRole("status")).toHaveTextContent(`Email: ${site.email}`);
    expect(screen.getByText(site.email, { selector: "span" })).toBeInTheDocument();
  });
});
