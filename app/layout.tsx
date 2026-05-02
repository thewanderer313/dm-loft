import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DM Loft",
  description: "A hub for DM tools.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
