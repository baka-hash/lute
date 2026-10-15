import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lute",
  description:
    "Lute combines physical AI software, monitoring, and remote support. Together they turn emerging capabilities into work businesses can rely on today.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fragment Mono + Newsreader (fallback for Season Mix, used if installed). Loaded as in the prototype so
            Newsreader keeps its optical-size axis at the light 300 weight. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fragment+Mono&family=Newsreader:opsz,wght@6..72,300&display=swap" />
        {/* hold the hero on its first frame until the intro timeline is built (removed in Hero) */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('booting')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
