import "server-only";
import { z } from "zod";
import { failure, success, type Result } from "./result";

// Reads and checks the Supabase environment (server side only). The project uses the
// new keys: a publishable key (`sb_publishable_`, safe for the browser) and a secret key
// (`sb_secret_`, server only). The legacy anon and service role keys are refused, so an
// old key can never be picked up by mistake.

export type PublicEnv = { url: string; publishableKey: string };
export type ServerEnv = PublicEnv & { secretKey: string };

type Source = Record<string, string | undefined>;

// Next replaces `process.env.NEXT_PUBLIC_*` with the build time value only when the name is
// written out in full. A lookup by variable (`process.env[name]`) is not replaced, so the
// image would read these as missing at runtime. Keep these reads literal. The secret keys
// are not NEXT_PUBLIC_, so they stay runtime reads and never enter the bundle.
function fromProcess(): Source {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  };
}

const legacyVariables = ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;

const projectUrl = z.string().refine(
  (value) => {
    try {
      const url = new URL(value);
      const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
      return url.protocol === "https:" || (local && url.protocol === "http:");
    } catch {
      return false;
    }
  },
  { message: "must be an https URL (http only for localhost)" },
);

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: projectUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_", {
    message: 'must start with "sb_publishable_"',
  }),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_", { message: 'must start with "sb_secret_"' }),
});

function legacyProblem(source: Source) {
  const found = legacyVariables.filter((name) => source[name]);
  return found.length
    ? failure(
        "invalid_config",
        `${found.join(" and ")} is a legacy key and is not supported. Use the new keys.`,
      )
    : null;
}

function describe(error: z.ZodError) {
  // Names the variables and the rule, never the value.
  return error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; ");
}

function present(source: Source, names: string[]) {
  return names.every((name) => source[name]);
}

export function readPublicEnv(source: Source = fromProcess()): Result<PublicEnv> {
  const legacy = legacyProblem(source);
  if (legacy) return legacy;
  if (!present(source, ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"])) {
    return failure("unconfigured", "Supabase is not configured.");
  }
  const parsed = publicSchema.safeParse(source);
  if (!parsed.success) return failure("invalid_config", describe(parsed.error));
  return success({
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function readServerEnv(source: Source = fromProcess()): Result<ServerEnv> {
  const legacy = legacyProblem(source);
  if (legacy) return legacy;
  if (
    !present(source, [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SECRET_KEY",
    ])
  ) {
    return failure("unconfigured", "Supabase is not configured.");
  }
  const parsed = serverSchema.safeParse(source);
  if (!parsed.success) return failure("invalid_config", describe(parsed.error));
  return success({
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    secretKey: parsed.data.SUPABASE_SECRET_KEY,
  });
}
