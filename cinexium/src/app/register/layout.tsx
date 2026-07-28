import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - Cinexium",
  description: "Create a new Cinexium account.",
  alternates: { canonical: "https://cinexium.site/register" },
  openGraph: { title: "Register - Cinexium", description: "Create a new Cinexium account.", url: "https://cinexium.site/register" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
