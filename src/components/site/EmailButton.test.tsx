import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { site } from "@/lib/site";
import { EmailButton } from "./EmailButton";
import { ToastProvider } from "./Toast";

describe("EmailButton", () => {
  it("is a mailto link that also copies the address and announces it", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(
      <ToastProvider>
        <EmailButton />
      </ToastProvider>,
    );
    const link = screen.getByRole("link", { name: /Email me/ });
    expect(link).toHaveAttribute("href", `mailto:${site.email}`);

    link.addEventListener("click", (event) => event.preventDefault()); // don't navigate in jsdom
    await user.click(link);
    expect(writeText).toHaveBeenCalledWith(site.email);
    expect(await screen.findByRole("status")).toHaveTextContent(`Email copied: ${site.email}`);
  });
});
