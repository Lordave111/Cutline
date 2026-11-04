import "./globals.css";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--mono" });
const sans = Space_Grotesk({ subsets: ["latin"], variable: "--sans" });

export const metadata: Metadata = {
  title: "Cutline: remove and replace image backgrounds",
  description: "Remove a photo's background, then drop in a color, your own image, or a background described in words.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${mono.variable} ${sans.variable}`}>
        <head>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4249617873608629"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
