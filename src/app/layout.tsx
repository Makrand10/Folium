import './globals.css';
import { Inter } from 'next/font/google';
import Provider from "@/components/session-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'EPUBHUB',
  description: 'Your personal EPUB reader',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
