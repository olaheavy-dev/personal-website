import type { MetadataRoute } from "next";
import { getFlags } from "@/lib/db/queries/flags";
import { visiblePages } from "@/lib/flags/registry";
import { getViewer } from "@/lib/flags/visibility";
import { site } from "@/lib/site";

// Home and every page whose flag is visible to the public. A page switched off drops out
// when the flags tag is revalidated, together with the navigation (decision 0018).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = visiblePages(await getFlags(), await getViewer());
  return [{ url: site.url }, ...pages.map((page) => ({ url: `${site.url}${page.href}` }))];
}
