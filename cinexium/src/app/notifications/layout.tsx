import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications - Cinexium",
  description: "View your notifications.",
  alternates: { canonical: "https://cinexium.site/notifications" },
  openGraph: { title: "Notifications - Cinexium", description: "View your notifications.", url: "https://cinexium.site/notifications" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
