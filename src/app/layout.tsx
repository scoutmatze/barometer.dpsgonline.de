import type { Metadata } from 'next';
import { PT_Sans_Narrow } from 'next/font/google';
import './globals.css';

const ptSansNarrow = PT_Sans_Narrow({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-sans-narrow',
});

export const metadata: Metadata = {
  title: 'BL-O-Meter | DPSG',
  description: 'Rückmeldetool für Bundesleitungs-Sitzungen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={ptSansNarrow.variable}>
      <body className={`min-h-screen bg-dpsg-beige-50 text-dpsg-gray-900 ${ptSansNarrow.className}`}>
        {children}
      </body>
    </html>
  );
}
