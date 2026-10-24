// Health check for Docker, the SoloForge App Registry and the post-deploy smoke.
// BUILD_SHA is baked into the image at build time (see Dockerfile), so this
// response is prerendered and reports exactly which commit is running. It is
// never set at runtime, so the deployed commit can't be disguised.
export function GET() {
  return Response.json(
    { status: "ok", sha: process.env.BUILD_SHA ?? "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
