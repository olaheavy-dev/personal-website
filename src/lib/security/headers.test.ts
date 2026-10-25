import { afterEach, describe, expect, it, vi } from "vitest";
import { adminHeaders, baseHeaders, buildCsp, createNonce, headerRules } from "./headers";

const directives = (csp: string) => csp.split("; ");

describe("buildCsp", () => {
  it("criterion 1: the page policy is exact", () => {
    expect(buildCsp("page")).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "manifest-src 'self'",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join("; "),
    );
  });

  it("criterion 1: the api policy is exact", () => {
    expect(buildCsp("api")).toBe("default-src 'none'; frame-ancestors 'none'");
  });

  it("criterion 1: the admin policy uses the nonce, strict-dynamic and the Supabase origin", () => {
    const csp = buildCsp("admin", { nonce: "abc123==", supabaseOrigin: "https://proj.supabase.co/rest/v1" });
    const list = directives(csp);
    expect(list).toContain("script-src 'self' 'nonce-abc123==' 'strict-dynamic'");
    expect(list).toContain("style-src 'self' 'nonce-abc123=='");
    expect(list).toContain("connect-src 'self' https://proj.supabase.co wss://proj.supabase.co");
    expect(list).toContain("img-src 'self' data: blob: https://proj.supabase.co");
    expect(csp).not.toContain("unsafe-inline");
  });

  it("criterion 1: the admin policy refuses to build without a nonce", () => {
    expect(() => buildCsp("admin")).toThrow(/nonce/);
  });

  it("criterion 1: every kind sets frame-ancestors 'none'", () => {
    for (const csp of [buildCsp("page"), buildCsp("api"), buildCsp("admin", { nonce: "n" })]) {
      expect(directives(csp)).toContain("frame-ancestors 'none'");
    }
  });

  it("criterion 1: unsafe-eval appears only in development", () => {
    for (const kind of ["page", "admin"] as const) {
      expect(buildCsp(kind, { nonce: "n" })).not.toContain("unsafe-eval");
      expect(buildCsp(kind, { nonce: "n", isDev: false })).not.toContain("unsafe-eval");
      expect(buildCsp(kind, { nonce: "n", isDev: true })).toContain("'unsafe-eval'");
    }
  });
});

describe("createNonce", () => {
  it("criterion 2: is unique and carries at least 128 bits", () => {
    const nonces = new Set(Array.from({ length: 200 }, () => createNonce()));
    expect(nonces.size).toBe(200);
    for (const nonce of nonces) expect(atob(nonce).length).toBeGreaterThanOrEqual(16);
  });
});

describe("baseHeaders", () => {
  it("criterion 3: carries the agreed values once each", () => {
    const headers = Object.fromEntries(baseHeaders().map((h) => [h.key, h.value]));
    expect(baseHeaders()).toHaveLength(Object.keys(headers).length);
    expect(headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cross-Origin-Opener-Policy": "same-origin",
      "X-Frame-Options": "DENY",
      "Strict-Transport-Security": "max-age=31536000",
    });
    expect(headers["Strict-Transport-Security"]).not.toMatch(/includeSubDomains|preload/);
    for (const feature of ["camera", "microphone", "geolocation", "payment", "usb", "browsing-topics"]) {
      expect(headers["Permissions-Policy"]).toContain(`${feature}=()`);
    }
    expect(headers["Permissions-Policy"]).toContain("fullscreen=(self)");
  });
});

describe("adminHeaders", () => {
  it("is not cached, sends no referrer and is kept out of search", () => {
    const headers = Object.fromEntries(adminHeaders().map((h) => [h.key, h.value]));
    expect(headers).toMatchObject({
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      "Cross-Origin-Resource-Policy": "same-origin",
    });
  });
});

describe("headerRules", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("criterion 3: gives each path exactly one CSP, in disjoint rules", () => {
    const withCsp = headerRules().filter((rule) =>
      rule.headers.some((h) => h.key === "Content-Security-Policy"),
    );
    const page = withCsp.filter((r) => r.headers[0]!.value === buildCsp("page"));
    const api = withCsp.filter((r) => r.headers[0]!.value === buildCsp("api"));
    expect(page).toHaveLength(1);
    expect(api.map((r) => r.source).sort()).toEqual(["/api/:path*", "/healthz"]);
    // The page rule must not match the api paths.
    const pattern = new RegExp(`^${page[0]!.source}$`);
    expect(pattern.test("/")).toBe(true);
    expect(pattern.test("/work")).toBe(true);
    expect(pattern.test("/api")).toBe(false);
    expect(pattern.test("/api/ask")).toBe(false);
    expect(pattern.test("/healthz")).toBe(false);
    expect(pattern.test("/apiary")).toBe(true);
  });

  it("criterion 1: allows eval only when NODE_ENV is development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(JSON.stringify(headerRules())).toContain("'unsafe-eval'");
    vi.stubEnv("NODE_ENV", "production");
    expect(JSON.stringify(headerRules())).not.toContain("'unsafe-eval'");
  });
});
