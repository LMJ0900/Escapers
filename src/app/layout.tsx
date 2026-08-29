import type { Metadata } from "next";
import "./globals.css";
import { fontClassName } from "@/styles/fonts";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Escapers",
  description: "방탈출 리뷰",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={fontClassName}>
      <body>
        <Header>{children}</Header>
        <Footer />
      </body>
    </html>
  );
}
