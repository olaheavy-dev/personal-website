import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunkanmi Olawuwo",
  description: "Personal site of Sunkanmi Olawuwo, full-stack and AI engineer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
