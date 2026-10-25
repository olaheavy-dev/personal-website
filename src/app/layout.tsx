import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/site/Footer";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ToastProvider } from "@/components/site/Toast";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-(--z-skip-link) focus:rounded-full focus:bg-bg-elevated focus:px-4 focus:py-3"
        >
          Skip to content
        </a>
        <ToastProvider>
          <SiteHeader />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
