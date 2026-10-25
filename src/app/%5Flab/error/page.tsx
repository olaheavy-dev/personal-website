// Developer only page at /_lab/error, to test the error boundary (error.tsx).
// It throws while the `lab-error` cookie is set, so a test can then clear the
// cookie and press Try again. Off unless LAB_PAGES=1; never in nav or the sitemap.
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { labPagesEnabled } from "@/lib/lab-pages";

export const metadata: Metadata = { title: "Error lab", robots: { index: false, follow: false } };

async function Lab() {
  await connection();
  if (!labPagesEnabled()) notFound();
  if ((await cookies()).has("lab-error")) throw new Error("internal detail that must never be shown");
  return (
    <main id="main" className="mx-auto w-full max-w-wide px-(--gutter) py-8">
      <h1 className="font-display text-3xl tracking-tight">Recovered</h1>
      <p className="mt-2 text-text-secondary">Developer page for the error boundary. Not part of the site.</p>
    </main>
  );
}

export default function ErrorLabPage() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
