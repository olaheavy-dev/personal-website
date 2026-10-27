import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { expireTag, secondPassAfterMs } from "./expire-tag";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));

describe("expireTag", () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(after).mockClear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("expires the tag at once, with stale content never served", () => {
    expireTag("flags");
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith("flags", { expire: 0 });
  });

  it("expires it again after the pause, and not before", async () => {
    expireTag("flags");
    expect(after).toHaveBeenCalledTimes(1);
    const second = vi.mocked(after).mock.calls[0]![0] as () => Promise<void>;
    const done = second();
    await vi.advanceTimersByTimeAsync(secondPassAfterMs - 1);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await done;
    expect(revalidateTag).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenLastCalledWith("flags", { expire: 0 });
  });

  it("keeps the pause under what a stopping server waits for pending work", () => {
    expect(secondPassAfterMs).toBeLessThanOrEqual(10_000);
  });
});
