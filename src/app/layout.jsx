import { Inter, JetBrains_Mono, Anton } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const anton = Anton({
  subsets: ['latin'],
  variable: '--font-wordmark',
  display: 'swap',
  weight: '400',
});

export const metadata = {
  title: 'PattayaCams | Live Street Webcams, Beach Feeds & City Transit Radar',
  description: 'Real-time interactive map, municipal CCTV streams, beachfront live cams, and Songthaew transit radar for Pattaya, Thailand.',
  keywords: ['Pattaya webcams', 'Pattaya live camera', 'Walking Street Pattaya', 'Pattaya Beach live', 'Songthaew Baht bus map', 'Pattaya CCTV'],
  authors: [{ name: 'PattayaCams' }],
  metadataBase: new URL('https://pattayacams.com'),
  openGraph: {
    title: 'PattayaCams | Live Street Webcams & Transit Radar',
    description: 'Real-time interactive map and live streams for Pattaya, Thailand.',
    url: 'https://pattayacams.com',
    siteName: 'PattayaCams',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PattayaCams Live Feeds & Transit Radar',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PattayaCams | Live Street Webcams & Transit Radar',
    description: 'Explore live webcams and Songthaew routes in Pattaya, Thailand.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PattayaCams',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable} ${anton.variable}`}>
      <body className="bg-canvas text-slate-100 antialiased min-h-screen w-full flex flex-col overflow-x-hidden selection:bg-brandPink selection:text-white">
        {children}
      </body>
    </html>
  );
}
