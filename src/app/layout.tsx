import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Providers } from '@/components/Providers';
import { Toaster } from 'sonner';
import clsx from "clsx";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FileSeek - Filecoin File Discovery",
  description: "Discover and interact with files stored on Filecoin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={clsx(inter.className, "bg-black")}>
        <Providers>
          <Header />
          <main className="min-h-screen bg-black">
            {children}
          </main>
          <Toaster theme="dark" position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
