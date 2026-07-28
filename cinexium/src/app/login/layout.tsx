import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Cinexium",
  description: "Login to your Cinexium account.",
  alternates: { canonical: "https://cinexium.site/login" },
  openGraph: { title: "Login - Cinexium", description: "Login to your Cinexium account.", url: "https://cinexium.site/login" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
