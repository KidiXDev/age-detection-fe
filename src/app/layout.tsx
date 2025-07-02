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
  title: "AI Age Detector | Deteksi Umur dengan Kecerdasan Buatan",
  description: "Aplikasi web untuk mendeteksi umur dari foto menggunakan teknologi AI dan machine learning. Upload foto dan dapatkan prediksi umur secara akurat.",
  keywords: ["age detection", "AI", "machine learning", "computer vision", "deteksi umur"],
  authors: [{ name: "Age Detector Team" }],
  openGraph: {
    title: "AI Age Detector",
    description: "Deteksi umur dari foto menggunakan AI",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
