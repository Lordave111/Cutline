import "./globals.css";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--mono" });
const sans = Space_Grotesk({ subsets: ["latin"], variable: "--sans" });
const siteUrl = "https://cutline-gamma.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cutline — AI Photo Editor & Creative Studio",
    template: "%s | Cutline",
  },
  description: "Remove image backgrounds, retouch photos, build new scenes and fine-tune every detail in Cutline's online creative studio.",
  applicationName: "Cutline",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Cutline",
    title: "Cutline — AI Photo Editor & Creative Studio",
    description: "A focused online studio for background removal, photo editing and AI-assisted image creation.",
    images: [{ url: "/icon.svg", alt: "Cutline creative studio" }],
  },
  twitter: {
    card: "summary",
    title: "Cutline — AI Photo Editor & Creative Studio",
    description: "Remove backgrounds, refine photos and create polished visuals in one online studio.",
  },
  robots: { index: true, follow: true },
  applicationName: "Cutline",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Cutline" },
  other: { "google-adsense-account": "ca-pub-4249617873608629" },
};

export const viewport: Viewport = {
  themeColor: "#f3f5fa",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${mono.variable} ${sans.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
