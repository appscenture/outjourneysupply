import "../src/styles/index.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Outjourney | Food Supply & Paket Catering untuk Bisnis",
  description:
    "Food supply, paket catering, and a faster B2B ordering workspace for food service businesses.",
  applicationName: "Outjourney",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Outjourney",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#004aad",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
