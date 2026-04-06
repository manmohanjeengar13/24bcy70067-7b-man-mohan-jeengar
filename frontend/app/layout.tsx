import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProductHub',
  description: 'Full-stack product management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
