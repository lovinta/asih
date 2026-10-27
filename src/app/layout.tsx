import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asih — an AI helper for daily life",
  description:
    "Helper for older adults: appointment letters, finding groups, and checking ads.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
