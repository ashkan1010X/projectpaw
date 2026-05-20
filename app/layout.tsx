import type { Metadata } from 'next';
import { Geist, Geist_Mono, Playfair_Display, Baloo_2 } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { NavBar } from '@/components/nav-bar';
import { StickyMobileCta } from '@/components/sticky-mobile-cta';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const playfairDisplay = Playfair_Display({
  variable: '--font-elegant',
  subsets: ['latin'],
  display: 'swap',
});

const baloo2 = Baloo_2({
  variable: '--font-pawprint',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ProjectPaw — Dog Services',
  description: 'Book grooming, boarding, training, walking, vet, daycare and more for your dog.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${baloo2.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f0d09] text-paw">
        <AuthProvider>
          <NavBar />
          <main id="main-content" className="flex-1">{children}</main>
          <StickyMobileCta />
        </AuthProvider>
      </body>
    </html>
  );
}
