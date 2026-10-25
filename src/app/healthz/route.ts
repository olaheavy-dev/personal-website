import { connection } from "next/server";
import { readPublicEnv } from "@/lib/db/env";

// Health check for Docker, the SoloForge App Registry and the post-deploy smoke.
//
// `sha` is the commit the image was built from. BUILD_SHA is set in the Dockerfile's build
// stage only; next.config.ts writes it into the build, so the running image reports it
// without the runtime stage carrying the variable.
//
// `supabase` is "configured" when the Supabase browser values were built in, and
// "unconfigured" when they were not. Never a value, only that word. It is read at request
// time (connection()), so a container started with no Supabase variables still says
// "configured" exactly when the build inlined them. The publish workflow runs the candidate
// image with none and refuses to push unless it sees "configured".
export async function GET() {
  await connection();
  return Response.json(
    {
      status: "ok",
      sha: process.env.BUILD_SHA ?? "dev",
      supabase: readPublicEnv().ok ? "configured" : "unconfigured",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
