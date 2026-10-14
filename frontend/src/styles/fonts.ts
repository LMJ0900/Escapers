import { Cormorant_Garamond, Spectral } from "next/font/google";

export const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  fallback: ["Times New Roman", "serif"],
  variable: "--font-serif",
});

export const text = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  fallback: ["Georgia", "serif"],
  variable: "--font-text",
});

export const fontClassName = `${serif.variable} ${text.variable}`;
