import type { Metadata } from "next";
import { Dancing_Script, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "For Veronica — A Little Just-Because Surprise",
  description:
    "A dreamy pastel corner of the internet, made for Veronica with love from Mahal.",
  openGraph: {
    title: "For Veronica",
    description: "A little just-because surprise from Mahal.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "For Veronica" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "For Veronica",
    description: "A little just-because surprise from Mahal.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
