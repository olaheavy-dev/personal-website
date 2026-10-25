import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

// next/font only works inside the Next compiler, and the stylesheet is not needed here.
vi.mock("./fonts", () => ({ fontVariables: "font-test" }));
vi.mock("./globals.css", () => ({}));

import GlobalError from "./global-error";

const error = Object.assign(new Error("internal detail"), { digest: "abc123" });

describe("global-error.tsx", () => {
  it("criterion 28: brings its own html and body, one h1, the actions, and no other origins", () => {
    const html = renderToStaticMarkup(<GlobalError error={error} retry={() => {}} />);
    expect(html).toMatch(/^<html lang="en-GB"/);
    expect(html).toContain("<body>");
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Try again");
    expect(html).toContain("Back to the start");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="mailto:');
    expect(html).toContain(">Email me<");
    expect(html).toContain("Sunkanmi Olawuwo");
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).not.toContain("internal detail");
    expect(html).toContain("abc123");
    // Only same origin or mailto links, and no external scripts, styles or images.
    expect(html).not.toMatch(/(?:src|href)="https?:/);
    expect(html).not.toContain("<img");
  });

  it("criterion 29: Try again calls retry, and focus starts on the h1", async () => {
    const retry = vi.fn();
    const root = createRoot(document);
    await act(async () => root.render(<GlobalError error={error} retry={retry} />));
    const heading = document.querySelector("h1");
    expect(heading).toHaveFocus();
    const button = [...document.querySelectorAll("button")].find((b) => b.textContent === "Try again")!;
    await userEvent.setup().click(button);
    expect(retry).toHaveBeenCalledOnce();
    await act(async () => root.unmount());
  });
});
