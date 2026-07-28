import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Cinexium",
  description: "Read the privacy policy for Cinexium.",
  alternates: { canonical: "https://cinexium.site/privacy" },
  openGraph: { title: "Privacy Policy - Cinexium", description: "Read the privacy policy for Cinexium.", url: "https://cinexium.site/privacy" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
