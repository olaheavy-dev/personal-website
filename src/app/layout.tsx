import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/site/Footer";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ToastProvider } from "@/components/site/Toast";
import { getFlags } from "@/lib/db/queries/flags";
import { visiblePages } from "@/lib/flags/registry";
import { getViewer } from "@/lib/flags/visibility";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/theme-script";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Products from idea to production, with AI built in`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
};

// Browser UI colour: <meta name="theme-color"> cannot read CSS variables, so these
// mirror --color-bg-primary for each theme in src/styles/tokens.css.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#131217" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The navigation shows the pages whose flag is visible to this viewer. getFlags() is
  // cached and tagged, so this stays part of the prerendered shell (decision 0018).
  const items = visiblePages(await getFlags(), await getViewer());
  return (
    <html lang="en-GB" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Without JavaScript an expanding ticket (TicketExpander) shows its content and has no
            button to press. A noscript style rather than "@media (scripting: none)": it holds
            in every browser and in the test harness, which does not report that feature. */}
        <noscript>
          <style>{".ticket-expander{grid-template-rows:1fr}.ticket-expander-toggle{display:none}"}</style>
        </noscript>
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-(--z-skip-link) focus:rounded-full focus:bg-bg-elevated focus:px-4 focus:py-3"
        >
          Skip to content
        </a>
        <ToastProvider>
          <SiteHeader items={items} />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
