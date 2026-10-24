// Health check for Docker, the SoloForge App Registry and the post-deploy smoke.
// BUILD_SHA is only set in the Dockerfile's build stage, so this response is
// prerendered with the commit baked in and reports exactly which commit is
// running. The runtime image doesn't set it, so it can't be overridden there.
export function GET() {
  return Response.json(
    { status: "ok", sha: process.env.BUILD_SHA ?? "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
