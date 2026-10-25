import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

const request = () => new NextRequest("https://example.test/_lab/route");

describe("proxy (lab gate)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("criterion 13: rewrites to the not found page unless LAB_PAGES is 1", () => {
    vi.stubEnv("LAB_PAGES", "");
    const response = proxy(request());
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://example.test/not-found-lab-off");
  });

  it("criterion 13: lets the request through when LAB_PAGES is 1", () => {
    vi.stubEnv("LAB_PAGES", "1");
    const response = proxy(request());
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
