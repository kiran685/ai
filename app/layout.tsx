import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Career OS",
  description:
    "Upload your resume, discover your skill gaps, and get an adaptive plan that tells you what to do next.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col items-center w-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
