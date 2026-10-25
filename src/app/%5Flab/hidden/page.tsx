// Developer only page at /_lab/hidden: the build time proof of how a page switched off by a
// feature flag behaves (decision 0018). Its flag, "lab.hidden", is never set, so it is Off
// when `next build` prerenders it, and the page must be a static 404 that looks exactly like
// a mistyped URL: the Wrong turn title, noindex and a real 404 status, with no request time
// work. It is the pattern to copy for a real page: `gatePage` first in generateMetadata, then
// at the top of the page. A static `metadata` export would leak the hidden page's own title.
// Off unless LAB_PAGES=1 (src/proxy.ts).
import type { Metadata } from "next";
import { gatePage } from "@/lib/flags/gate";

export async function generateMetadata(): Promise<Metadata> {
  await gatePage("lab.hidden");
  return { title: "Hidden lab" };
}

export default async function HiddenLabPage() {
  await gatePage("lab.hidden");
  return <main id="main">This page is never shown.</main>;
}
