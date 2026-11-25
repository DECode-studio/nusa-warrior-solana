import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nusa Warriors: Permainan Kartu Strategi Sejarah & Budaya Nusantara",
  description:
    "Nusa Warriors — Permainan kartu strategi edukatif berbasis 30 tokoh Majapahit dan Pajajaran serta 30 waditra atau instrumen musik tradisional Nusantara.",
  icons: {
    icon: [
      { url: "/app-icon.png", type: "image/png" },
      { url: "/assets/app-icon.png", type: "image/png" },
    ],
    shortcut: "/app-icon.png",
    apple: [
      { url: "/app-icon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html
      lang="id"
      className="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="/app-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/app-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;900&family=Rajdhani:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#080220] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
