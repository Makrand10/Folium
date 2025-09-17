// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/session-provider";
import HeaderUser from "@/components/headeruser";
import SearchBar from "@/components/searchbar";

export const metadata: Metadata = {
  title: "FOLIUM",
  description: "Read EPUBs in your browser",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <header className="border-b p-4">
            <div className="max-w-6xl mx-auto flex items-center gap-4">
              {/* Left: Logo */}
              <h1 className="text-xl font-semibold shrink-0">
                <a href="/">FOLIUM</a>
              </h1>

              {/* Center: SearchBar */}
              <div className="flex-1">
                <SearchBar />
              </div>

              {/* Right: User */}
              <div className="shrink-0">
                <HeaderUser />
              </div>
            </div>
          </header>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
