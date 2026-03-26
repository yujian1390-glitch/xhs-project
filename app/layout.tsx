import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "文档转小红书图片工具",
  description: "Next.js + TypeScript 项目骨架"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
