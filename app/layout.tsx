import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DM Loft",
  description: "A hub for DM tools.",
};

const FONTS_HREF =
  "https://fonts.googleapis.com/css2" +
  "?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500" +
  "&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400" +
  "&family=Cinzel:wght@400;500;600;700" +
  "&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400" +
  "&family=JetBrains+Mono:wght@400;500" +
  "&display=swap";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS_HREF} />
      </head>
      <body className="antialiased tome-page">{children}</body>
    </html>
  );
}
