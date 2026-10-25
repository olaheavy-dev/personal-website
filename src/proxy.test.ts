import { readdirSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pageRegistry } from "@/lib/flags/registry";
import { config, proxy } from "./proxy";

const request = () => new NextRequest("https://example.test/_lab/route");

describe("proxy (lab gate)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("criterion 13: rewrites to the not found page unless LAB_PAGES is 1", () => {
    vi.stubEnv("LAB_PAGES", "");
    const response = proxy(request());
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://example.test/not-found-unmatched");
  });

  it("criterion 13: lets the request through when LAB_PAGES is 1", () => {
    vi.stubEnv("LAB_PAGES", "1");
    const response = proxy(request());
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});

describe("proxy (unknown addresses)", () => {
  const rewritten = (path: string) =>
    proxy(new NextRequest(`https://example.test${path}`)).headers.get("x-middleware-rewrite");
  const pattern = new RegExp(`^${config.matcher[0]}$`);
  const matches = (path: string) => pattern.test(path);

  it("rewrites an unknown address to one fixed path, whatever the address", () => {
    expect(rewritten("/first-missing-aaa")).toBe("https://example.test/not-found-unmatched");
    expect(rewritten("/api/nope")).toBe("https://example.test/api/not-found-unmatched");
    expect(rewritten("/work/nope?secret=1")).toBe("https://example.test/not-found-unmatched");
  });

  it("runs for every unknown address, dotted, under /api or under /_next included, and /_lab", () => {
    for (const path of [
      "/zzz",
      "/work/nope",
      "/_lab/route",
      "/a/b/c",
      "/missing/person@example.com",
      "/missing.html",
      "/api/nope",
      "/api/revalidate/x",
      "/_next/nope",
      "/logos/nope.svg",
      "/images/nope.jpg",
      "/robots.txt",
    ]) {
      expect(matches(path), path).toBe(true);
    }
  });

  it("skips what exists or is handled: assets, endpoints, the favicon, the sitemap, the fixed path", () => {
    for (const path of [
      "/",
      "/healthz",
      "/not-found-unmatched",
      "/api/not-found-unmatched",
      "/api/revalidate",
      "/_next/static/chunks/a.js",
      "/_next/image",
      "/favicon.ico",
      "/sitemap.xml",
      "/logos/hbk.svg",
      "/images/sunkanmi-256.jpg",
    ]) {
      expect(matches(path), path).toBe(false);
    }
  });

  it("skips every file in public/, so a new asset must be listed in the matcher", () => {
    const files = (directory: string): string[] =>
      readdirSync(join(__dirname, "..", "public", directory), { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(join(directory, entry.name)) : [`/${join(directory, entry.name)}`],
      );
    const all = readdirSync(join(__dirname, "..", "public"), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? files(entry.name) : [`/${entry.name}`],
    );
    expect(all.length).toBeGreaterThan(5);
    for (const path of all) expect(matches(path), path).toBe(false);
  });

  it("leaves every registered page alone, so the matcher stays in step with the registry", () => {
    for (const page of pageRegistry) expect(matches(page.href), page.href).toBe(false);
  });
});
