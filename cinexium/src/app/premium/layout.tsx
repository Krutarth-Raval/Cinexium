import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium - Cinexium",
  description: "Upgrade to Cinexium Premium.",
  alternates: { canonical: "https://cinexium.site/premium" },
  openGraph: { title: "Premium - Cinexium", description: "Upgrade to Cinexium Premium.", url: "https://cinexium.site/premium" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
