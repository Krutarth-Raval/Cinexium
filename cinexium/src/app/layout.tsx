import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#151519",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://cinexium.site'),
  title: {
    default: "Cinexium - Discover Trending Movies & TV Shows",
    template: "%s | Cinexium"
  },
  description: "Discover trending movies and TV series, explore ratings and trailers, build your ultimate watchlist, and connect with cinema fans worldwide on Cinexium.",
  applicationName: "Cinexium",
  authors: [{ name: "Cinexium Team", url: "https://cinexium.site" }],
  creator: "Cinexium",
  publisher: "Cinexium",
  keywords: ["movies", "tv shows", "cinema", "watchlist", "entertainment", "trending", "movie ratings", "Cinexium"],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cinexium.site",
    siteName: "Cinexium",
    title: "Cinexium - Discover Trending Movies & TV Shows",
    description: "Discover trending movies and TV series, explore ratings and trailers, build your ultimate watchlist, and connect with cinema fans worldwide on Cinexium.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cinexium - The Ultimate Cinema Tracking Experience",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cinexium - Discover Trending Movies & TV Shows",
    description: "Discover trending movies and TV series, explore ratings and trailers, build your ultimate watchlist, and connect with cinema fans worldwide.",
    images: ["/og-image.png"],
    creator: "@Cinexium",
  },
  icons: {
    icon: [
      { url: '/logo-mark.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Cinexium",
    statusBarStyle: "black-translucent",
  },
};

import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { WhatsNewModal } from "@/components/ui/WhatsNewModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={
        {
          "--font-geist-sans": "Arial, Helvetica, sans-serif",
          "--font-geist-mono": "Consolas, 'Courier New', monospace",
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5947969510780238" crossOrigin="anonymous"></script>
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Cinexium",
                url: "https://cinexium.site",
                logo: "https://cinexium.site/icon-512.png",
                sameAs: []
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Cinexium",
                url: "https://cinexium.site",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://cinexium.site/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ])
          }}
        />
        <Providers>
          <SocketProvider>
            <Navbar />
            <div className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </div>
            <Footer />
            <BottomNav />
            <WhatsNewModal />
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}
