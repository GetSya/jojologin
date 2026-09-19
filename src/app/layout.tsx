import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Register Bot WhatsApp — JVault",
  description: "Hubungkan nomor WhatsApp kamu ke bot dalam beberapa detik.",
  icons: {
    icon: [
      { url: "/icon.jpg", type: "image/jpeg" },
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "https://files.catbox.moe/kezj43.jpg", type: "image/jpeg" },
    ],
    apple: [{ url: "/apple-icon.jpg", type: "image/jpeg" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fcfcf9]">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}

