import { readFileSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { getFlags } from "@/lib/db/queries/flags";
import { gatePage } from "./gate";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/lib/db/queries/flags", () => ({ getFlags: vi.fn() }));

describe("gatePage", () => {
  beforeEach(() => {
    vi.mocked(notFound).mockClear();
  });

  it("lets a page through when its flag is on", async () => {
    vi.mocked(getFlags).mockResolvedValue({ "page.work": "on" });
    await expect(gatePage("page.work")).resolves.toBeUndefined();
    expect(notFound).not.toHaveBeenCalled();
  });

  it.each([["off"], ["preview"], [undefined]] as const)("answers 404 when the flag is %s", async (state) => {
    vi.mocked(getFlags).mockResolvedValue(state ? { "page.work": state } : {});
    await expect(gatePage("page.work")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("lets a failed flag read through to the error page instead of hiding the page", async () => {
    vi.mocked(getFlags).mockRejectedValue(new Error("Feature flags cannot be read"));
    await expect(gatePage("page.work")).rejects.toThrow("cannot be read");
    expect(notFound).not.toHaveBeenCalled();
  });
});

// Issue #88: the gate must be decided while the page is prerendered. Anything that reads the
// request (cookies, headers, connection, searchParams) in front of it makes every Off page
// answer 200 with a noindex body. Instead of hunting for forbidden words, each file may import
// only what is listed here, so a new request bound import fails. If this fails because owner
// Preview (#23) needs a session, do not add it here: serve the owner a separate dynamic route
// (docs/flags.md, "The rule: nothing request bound before the gate").
const root = join(__dirname);
const allowed: Record<string, string[]> = {
  "gate.ts": ["server-only", "next/navigation", "@/lib/db/queries/flags", "./visibility"],
  "visibility.ts": [],
};
const banned = ["next/headers", "next/server"];

// Comments may name APIs (gate.ts explains the rule); only code counts.
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// Every module specifier imported (static, side effect or dynamic), type only imports aside.
function imports(source: string): string[] {
  const text = code(source);
  const found: string[] = [];
  for (const m of text.matchAll(/^\s*import\s+(type\s+)?[^"';]*?from\s*["']([^"']+)["']/gm)) {
    if (!m[1] && m[2]) found.push(m[2]);
  }
  for (const m of text.matchAll(/^\s*import\s*["']([^"']+)["']/gm)) found.push(m[1] ?? "");
  for (const m of text.matchAll(/\b(?:import|require)\(\s*["']([^"']+)["']\s*\)/g)) found.push(m[1] ?? "");
  return found;
}

describe("gatePage reads no request data", () => {
  it.each(Object.keys(allowed))("%s imports only what the rule allows", (file) => {
    const found = imports(readFileSync(join(root, file), "utf8"));
    for (const name of banned) expect(found, `${file} must not import ${name}`).not.toContain(name);
    expect(
      found.filter((name) => !(allowed[file] ?? []).includes(name)),
      `${file} imports something new; see docs/flags.md`,
    ).toEqual([]);
  });

  it("visibility.ts only imports types", () => {
    const source = code(readFileSync(join(root, "visibility.ts"), "utf8"));
    expect(source).toMatch(/import type \{[^}]*\} from "@\/lib\/db\/types"/);
    expect(source.match(/^\s*import\b/gm)).toHaveLength(1);
  });

  it("the flag read stays a cached read, which is what keeps the gate off the request", () => {
    const source = readFileSync(join(root, "..", "db", "queries", "flags.ts"), "utf8");
    expect(source).toContain('"use cache"');
    expect(source).toContain("cacheTag(");
  });

  it("the checker sees an aliased import and ignores commented out calls", () => {
    const sample = [
      "// await cookies();",
      '/* import { headers } from "next/headers"; */',
      'import { connection as ready } from "next/server";',
      'import type { Thing } from "@/lib/db/types";',
      'const later = await import("next/headers");',
    ].join("\n");
    expect(imports(sample)).toEqual(["next/server", "next/headers"]);
    expect(code(sample)).not.toContain("cookies");
  });
});
