// Fonts shared by the root layout and the global error page (which replaces the
// layout and so has to load them itself).
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

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

export const fontVariables = `${bricolage.variable} ${geist.variable} ${geistMono.variable}`;
