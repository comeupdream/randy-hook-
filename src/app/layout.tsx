import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PRACTICE } from "@/lib/practice-config";
import "./globals.css";

// Fraunces — an awe-inspiring editorial serif whose optical-size axis blooms
// at display sizes while staying warm and soft-edged. Vendored locally
// (src/fonts, SIL OFL) so builds are deterministic and offline-safe.
const serif = localFont({
  src: [
    { path: "../fonts/fraunces-var.woff2", style: "normal", weight: "100 900" },
    { path: "../fonts/fraunces-italic-var.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-serif",
  display: "swap",
});

// Source Sans 3 — a humanist companion for body copy and UI.
const sans = localFont({
  src: [
    { path: "../fonts/source-sans-3-var.woff2", style: "normal", weight: "200 900" },
    { path: "../fonts/source-sans-3-italic-var.woff2", style: "italic", weight: "200 900" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.randyhooklcsw.com",
  ),
  title: {
    default: `${PRACTICE.name} — Counseling in Harrisonburg, VA`,
    template: `%s · ${PRACTICE.name}`,
  },
  description: PRACTICE.description,
  openGraph: {
    type: "website",
    siteName: PRACTICE.name,
    title: `${PRACTICE.name} — Counseling in Harrisonburg, VA`,
    description: PRACTICE.description,
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${PRACTICE.name} — Hope. Healing. Possibility.`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PRACTICE.name} — Counseling in Harrisonburg, VA`,
    description: PRACTICE.description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
