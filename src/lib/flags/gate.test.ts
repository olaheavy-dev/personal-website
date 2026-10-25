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
