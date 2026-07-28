import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines - Cinexium",
  description: "Read the community guidelines for Cinexium.",
  alternates: { canonical: "https://cinexium.site/guidelines" },
  openGraph: { title: "Community Guidelines - Cinexium", description: "Read the community guidelines for Cinexium.", url: "https://cinexium.site/guidelines" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
