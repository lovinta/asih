import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // TODO: name to be chosen by Vinta.
  title: "Older adults' helper (working name)",
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
