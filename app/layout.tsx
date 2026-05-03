import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TN Election Results 2026 | Live Tamil Nadu Assembly Results",
  description:
    "Track Tamil Nadu Legislative Assembly Election 2026 results in real-time. Live seat tally, party-wise results, vote share analysis and trend projections.",
  keywords: [
    "Tamil Nadu election 2026",
    "TN election results",
    "DMK",
    "AIADMK",
    "TVK",
    "NTK",
    "Tamil Nadu assembly election",
    "ECI results",
  ],
  openGraph: {
    title: "TN Election Results 2026 — Live Tracker",
    description: "Real-time Tamil Nadu Assembly Election Results 2026",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#030712" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
