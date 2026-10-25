import { checkBundleText, checkSourceText } from "./check-client-secrets.mjs";

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const jwt = (role: string) => `eyJhbGciOiJIUzI1NiJ9.${b64({ iss: "supabase", role })}.signature`;

describe("checkBundleText", () => {
  it("accepts a bundle with a publishable key", () => {
    expect(checkBundleText("a.js", 'const k="sb_publishable_abcdefghij";')).toEqual([]);
    expect(checkBundleText("a.js", `const anon="${jwt("anon")}";`)).toEqual([]);
  });

  it("rejects a secret key", () => {
    expect(checkBundleText("a.js", 'const k="sb_secret_abcdefghijkl";')).toHaveLength(1);
  });

  it("rejects the names of the secret variables", () => {
    expect(checkBundleText("a.js", "process.env.SUPABASE_SECRET_KEY")).toHaveLength(1);
    expect(checkBundleText("a.js", "process.env.SUPABASE_SERVICE_ROLE_KEY")).toHaveLength(1);
  });

  it("rejects a service_role JWT but not an anon one", () => {
    expect(checkBundleText("a.js", `x("${jwt("service_role")}")`)).toHaveLength(1);
  });
});

describe("checkSourceText", () => {
  it("rejects a public variable that carries a secret", () => {
    expect(checkSourceText(".env.example", "NEXT_PUBLIC_SUPABASE_SECRET_KEY=x")).toHaveLength(1);
    expect(checkSourceText("a.ts", "process.env.NEXT_PUBLIC_SERVICE_ROLE")).toHaveLength(1);
    expect(checkSourceText("a.ts", "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")).toEqual([]);
  });

  it("rejects a client component that imports the secret key client", () => {
    const client = '"use client";\nimport { createAdminClient } from "@/lib/db/admin";\n';
    expect(checkSourceText("c.tsx", client)).toHaveLength(1);
    expect(checkSourceText("c.tsx", "// note\n" + client)).toHaveLength(1);
  });

  it("allows a server file to import it", () => {
    expect(checkSourceText("route.ts", 'import { createAdminClient } from "@/lib/db/admin";')).toEqual([]);
  });
});
