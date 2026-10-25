export { defaultFlags, fakePort, fakePublishableKey, fakeUrl } from "./fake-constants.mjs";
export function startFakeSupabase(options?: { port?: number }): Promise<{
  url: string;
  close: () => Promise<void>;
}>;
