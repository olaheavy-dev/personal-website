import { getFlags } from "@/lib/db/queries/flags";
import sitemap from "./sitemap";

vi.mock("@/lib/db/queries/flags", () => ({ getFlags: vi.fn() }));

const urls = async () => (await sitemap()).map((entry) => entry.url);

describe("sitemap", () => {
  it("lists Home and every visible page", async () => {
    vi.mocked(getFlags).mockResolvedValue({
      "page.work": "on",
      "page.lab": "on",
      "page.writing": "on",
      "page.travel": "on",
      "page.about": "on",
    });
    expect(await urls()).toEqual([
      "https://olaheavy.dev",
      "https://olaheavy.dev/work",
      "https://olaheavy.dev/lab",
      "https://olaheavy.dev/writing",
      "https://olaheavy.dev/travel",
      "https://olaheavy.dev/about",
    ]);
  });

  it("leaves out pages that are off or in preview", async () => {
    vi.mocked(getFlags).mockResolvedValue({ "page.work": "on", "page.lab": "off", "page.travel": "preview" });
    expect(await urls()).toEqual(["https://olaheavy.dev", "https://olaheavy.dev/work"]);
  });

  it("lists only Home when every page is off", async () => {
    vi.mocked(getFlags).mockResolvedValue({});
    expect(await urls()).toEqual(["https://olaheavy.dev"]);
  });
});
