import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Align Sports League | Cricket Tournament",
  description: "Align Cricket Tournament - Register teams, manage players, and track the tournament live.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <footer className="border-t border-gray-100 bg-white py-6 text-center">
            <p className="text-xs text-gray-400">
              Align Sports League &copy; {new Date().getFullYear()} &middot; Align Cricket Tournament
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
