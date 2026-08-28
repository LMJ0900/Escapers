import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escapers",
  description: "방탈출 리뷰",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
