import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Office Vibes - AI Document & Slide Creator',
  description: 'Create beautiful documents and presentations with AI. Vibe coding for docs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a]">{children}</body>
    </html>
  );
}
