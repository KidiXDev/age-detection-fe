import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Age Detector | Detect Age with Artificial Intelligence",
  description:
    "A web application to detect age from photos using AI and machine learning technology. Upload a photo and get an age prediction.",
  keywords: [
    "age detection",
    "AI",
    "machine learning",
    "computer vision",
    "age estimation",
    "photo analysis",
    "artificial intelligence",
    "image processing",
    "face recognition",
    "deep learning",
  ],
  authors: [{ name: "KidiXDev & AlvanCP" }],
  openGraph: {
    title: "AI Age Detector",
    description: "Detect age from photos using AI",
    type: "website",
    url: "https://age-detection.kdx.web.id",
    siteName: "AI Age Detector",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
