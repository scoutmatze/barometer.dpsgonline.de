import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BL-O-Meter | DPSG',
  description: 'Rückmeldetool für Bundesleitungs-Sitzungen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans+Narrow:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-dpsg-beige-50 text-dpsg-gray-900">
        {children}
      </body>
    </html>
  );
}
