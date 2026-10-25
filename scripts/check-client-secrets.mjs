// Fails if a server secret could reach the browser (decision 0004).
//
//   1. The browser bundle (.next/static, after `make build`) must not contain a Supabase
//      secret key, the names of the secret variables, or a JWT whose role is service_role.
//   2. No variable that starts with NEXT_PUBLIC_ may have SECRET or SERVICE_ROLE in its
//      name, because Next.js would publish its value to every visitor.
//   3. No file that starts with "use client" may import the secret key client.
//
// Run it with `make client-secrets` (part of `make check`, after the build).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const secretKey = /sb_secret_[A-Za-z0-9_-]{8,}/;
const secretNames = /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/;
const jwt = /eyJ[A-Za-z0-9_-]{5,}\.(eyJ[A-Za-z0-9_-]{5,})\.[A-Za-z0-9_-]*/g;
const publicSecretName = /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE)[A-Z0-9_]*/;
const adminImport =
  /from\s+["'][^"']*\/db\/admin(\.ts)?["']|import\s*\(\s*["'][^"']*\/db\/admin(\.ts)?["']\s*\)/;

function decodesToServiceRole(payload) {
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role === "service_role";
  } catch {
    return false;
  }
}

/** Problems in one file that ships to the browser. */
export function checkBundleText(name, text) {
  const problems = [];
  if (secretKey.test(text)) problems.push(`${name}: contains a Supabase secret key`);
  if (secretNames.test(text)) problems.push(`${name}: mentions a secret Supabase variable`);
  for (const match of text.matchAll(jwt)) {
    if (decodesToServiceRole(match[1])) problems.push(`${name}: contains a service_role JWT`);
  }
  return problems;
}

/** Problems in one source or config file. */
export function checkSourceText(name, text) {
  const problems = [];
  const variable = publicSecretName.exec(text);
  if (variable) problems.push(`${name}: ${variable[0]} would publish a secret to the browser`);
  const firstCode = text.replace(/^(\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, "");
  if (/^["']use client["']/.test(firstCode) && adminImport.test(text)) {
    problems.push(`${name}: a client component imports the secret key client`);
  }
  return problems;
}

function walk(directory, files = []) {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

function main() {
  const problems = [];
  const staticDir = join(".next", "static");
  if (!existsSync(staticDir)) {
    console.error("check-client-secrets: .next/static not found. Run `make build` first.");
    process.exit(1);
  }
  const bundleExtensions = new Set([".js", ".css", ".html", ".json", ".map", ".txt"]);
  for (const file of walk(staticDir).filter((file) => bundleExtensions.has(extname(file)))) {
    problems.push(...checkBundleText(file, readFileSync(file, "utf8")));
  }

  const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".example", ".yml"]);
  const skip = new Set(["scripts/check-client-secrets.mjs", "scripts/check-client-secrets.test.ts"]);
  for (const file of tracked) {
    if (skip.has(file) || !sourceExtensions.has(extname(file)) || !existsSync(file)) continue;
    problems.push(...checkSourceText(file, readFileSync(file, "utf8")));
  }

  if (problems.length) {
    console.error(`check-client-secrets: ${problems.length} problem(s)`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log("check-client-secrets: no server secret can reach the browser.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
