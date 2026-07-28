import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Cinexium",
  description: "Read the terms of service for Cinexium.",
  alternates: { canonical: "https://cinexium.site/terms" },
  openGraph: { title: "Terms of Service - Cinexium", description: "Read the terms of service for Cinexium.", url: "https://cinexium.site/terms" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
