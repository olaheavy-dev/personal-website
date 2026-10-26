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
// answer 200 with a noindex body. Mocks prove it is never called; the source check catches
// the day someone adds such a call. If this fails because owner Preview (#23) needs a session,
// do not add it here: serve the owner a separate dynamic route (docs/flags.md).
describe("gatePage reads no request data", () => {
  const forbidden = [
    "next/headers",
    "cookies(",
    "headers(",
    "connection(",
    "searchParams",
    "unstable_noStore",
  ];

  // Comments may name the forbidden APIs (gate.ts explains the rule); code may not.
  const code = (file: string) =>
    readFileSync(join(__dirname, file), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  it.each(["gate.ts", "visibility.ts"])("%s uses no request bound API", (file) => {
    for (const word of forbidden) {
      expect(code(file).includes(word), `${file} must not use ${word}; see docs/flags.md`).toBe(false);
    }
  });

  it("the check itself notices a forbidden call", () => {
    const sample = 'import { cookies } from "next/headers";\nawait cookies();';
    expect(forbidden.some((word) => sample.includes(word))).toBe(true);
  });
});
