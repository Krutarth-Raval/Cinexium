import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search - Cinexium",
  description: "Search for movies and TV shows on Cinexium.",
  alternates: { canonical: "https://cinexium.site/search" },
  openGraph: { title: "Search - Cinexium", description: "Search for movies and TV shows on Cinexium.", url: "https://cinexium.site/search" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
