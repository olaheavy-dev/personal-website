import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/site/Footer";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ToastProvider } from "@/components/site/Toast";
import { site } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

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

// How long a page waits for its script before showing routes finished. The route's
// undrawn state applies from first paint (so there is no finished then undrawn
// flash), which means a script that never loads would leave it undrawn for good.
// RouteObserver sets data-armed on mount; if none exists by then, data-route-fallback
// on <html> switches the undrawn state off. Well above a normal hydration time.
const ROUTE_FALLBACK_MS = 3000;

// Runs before first paint. Marks that JavaScript runs (data-js, which gates the
// route's undrawn state), arms the fallback above, and applies a saved theme.
// With no saved choice the stylesheet follows prefers-color-scheme, so there is
// nothing to set for the theme.
const themeScript = `(function(){var h=document.documentElement;h.setAttribute("data-js","");setTimeout(function(){if(!document.querySelector("[data-armed]"))h.setAttribute("data-route-fallback","")},${ROUTE_FALLBACK_MS});try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")h.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
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
