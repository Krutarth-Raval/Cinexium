import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify OTP - Cinexium",
  description: "Verify your email address.",
  alternates: { canonical: "https://cinexium.site/verify-otp" },
  openGraph: { title: "Verify OTP - Cinexium", description: "Verify your email address.", url: "https://cinexium.site/verify-otp" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
