import type { ReactElement } from "react";
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
    expect(html).toContain('href="/"');
    expect(html).toContain("Email me");
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).not.toContain("internal detail");
    expect(html).toContain("abc123");
    // Only same origin or mailto links, and no external scripts, styles or images.
    expect(html).not.toMatch(/(?:src|href)="https?:/);
  });

  it("criterion 29: hands retry to the Try again button", () => {
    const retry = vi.fn();
    const tree = GlobalError({ error, retry }) as ReactElement<{ children: ReactElement[] }>;
    const body = tree.props.children.find((child) => child.type === "body") as ReactElement<{
      children: ReactElement<{ onRetry: () => void }>;
    }>;
    body.props.children.props.onRetry();
    expect(retry).toHaveBeenCalledOnce();
  });
});
