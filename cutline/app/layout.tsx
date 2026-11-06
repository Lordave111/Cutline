import "./globals.css";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--mono" });
const sans = Space_Grotesk({ subsets: ["latin"], variable: "--sans" });

export const metadata: Metadata = {
  title: "Cutline — Creative Studio",
  description: "A fast, app-like creative studio for background removal, photo editing and AI-powered image creation.",
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
