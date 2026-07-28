import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Cinexium",
  description: "Manage your Cinexium account settings.",
  alternates: { canonical: "https://cinexium.site/settings" },
  openGraph: { title: "Settings - Cinexium", description: "Manage your Cinexium account settings.", url: "https://cinexium.site/settings" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
