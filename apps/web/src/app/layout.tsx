import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCP 마켓플레이스 — 한국 특화 MCP 서버 허브",
  description: "카카오, 네이버, 토스, 홈택스 등 국내 서비스 연동 MCP 서버를 한 곳에서 검색하고 설치하세요.",
  keywords: "MCP, Model Context Protocol, 카카오, 네이버, 토스, 홈택스, 한국어 AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
