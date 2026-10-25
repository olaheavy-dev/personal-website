// Developer only page at /_lab/hidden: it calls notFound() after the response has
// started streaming, like a page switched off by a feature flag will (#6), so a
// test can see the same Wrong turn page and noindex. Off unless LAB_PAGES=1.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Hidden lab", robots: { index: false, follow: false } };

async function Lab(): Promise<React.ReactNode> {
  await connection();
  notFound();
}

export default function HiddenLabPage() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}
