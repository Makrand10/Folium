// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/session-provider";
import HeaderUser from "@/components/headeruser";

export const metadata: Metadata = {
  title: "EPUBHUB",
  description: "Read EPUBs in your browser",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <header className="border-b p-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <h1 className="text-xl font-semibold">
                <a href="/">EPUBHUB</a>
              </h1>
              <HeaderUser />
            </div>
          </header>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}