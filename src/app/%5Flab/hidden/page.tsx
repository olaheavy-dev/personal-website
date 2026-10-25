// Developer only page at /_lab/hidden: it stands in for a page switched off by a
// feature flag (#6), so a test can see that a hidden page looks exactly like a
// mistyped URL: the Wrong turn title, one noindex and a real 404 status.
//
// The pattern to copy: the "is this page off?" check runs in generateMetadata,
// before anything streams. A static `metadata` export here would leak the hidden
// page's own title (the 404 would be titled "Hidden lab"), and a check only in the
// page body runs after streaming has begun, so the status would stay 200.
// Off unless LAB_PAGES=1.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

export async function generateMetadata() {
  await connection();
  notFound();
}

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
