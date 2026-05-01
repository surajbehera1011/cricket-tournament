import type { Metadata } from "next";
import { Suspense } from "react";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Align Sports League | Cricket & Pickleball Tournament",
  description: "Align Sports League - Register teams, manage players, and track tournaments live.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-dark-600">
        <div className="page-bg-image" />
        <div className="page-bg-overlay" />
        <Providers>
          <Suspense><Navbar /></Suspense>
          <main className="relative z-10 min-h-[calc(100vh-4rem)]">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
