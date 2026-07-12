import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cinexium",
  description: "Discover trending entertainment, explore ratings and trailers, build your watchlist, and connect with fans worldwide.",
};

import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { SocketProvider } from "@/components/providers/SocketProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>
          <SocketProvider>
            <Navbar />
            <div className="flex-1 pb-16 md:pb-0">
              {children}
            </div>
            <Footer />
            <BottomNav />
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}
