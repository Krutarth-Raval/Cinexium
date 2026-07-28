import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Cinexium",
  description: "Get in touch with the Cinexium team.",
  alternates: { canonical: "https://cinexium.site/contact" },
  openGraph: { title: "Contact Us - Cinexium", description: "Get in touch with the Cinexium team.", url: "https://cinexium.site/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
