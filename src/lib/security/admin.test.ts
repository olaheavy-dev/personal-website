import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { adminResponse } from "./admin";

const request = () => new NextRequest("https://example.test/admin");

describe("adminResponse", () => {
  it("criterion 1: sends the nonce policy and the admin headers to the browser", () => {
    const response = adminResponse(request(), { supabaseOrigin: "https://proj.supabase.co" });
    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(csp).toContain("wss://proj.supabase.co");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("criterion 2: uses a different nonce on every request", () => {
    const first = adminResponse(request());
    const second = adminResponse(request());
    const nonceOf = (r: Response) =>
      /'nonce-([^']+)'/.exec(r.headers.get("content-security-policy") ?? "")?.[1];
    expect(nonceOf(first)).toBeTruthy();
    expect(nonceOf(first)).not.toBe(nonceOf(second));
  });
});
