// Developer only demo pages (for example /_lab/route) exist only when the
// runtime variable LAB_PAGES is "1". Playwright sets it for its test server;
// the Docker image and the live site never do, so they answer 404.
export function labPagesEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.LAB_PAGES === "1";
}
