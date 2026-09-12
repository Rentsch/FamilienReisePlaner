import type { Metadata } from "next";
import Link from "next/link";
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
  title: "FamilienReisePlaner",
  description: "Familien-Reiseplaner mit Login und Datenbank",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="border-t border-[var(--border)] px-6 py-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/impressum" className="hover:text-foreground">
            Impressum
          </Link>
        </footer>
      </body>
    </html>
  );
}
