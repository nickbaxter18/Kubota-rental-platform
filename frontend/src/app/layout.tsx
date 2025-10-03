import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'U-Dig It Rentals - Kubota SVL-75 Equipment Rental | Saint John, NB',
  description: 'Rent the Kubota SVL-75 compact track loader from U-Dig It Rentals. Professional equipment rental in Saint John, New Brunswick with delivery available. Licensed, insured, 24/7 support.',
  keywords: 'Kubota SVL-75 rental, equipment rental Saint John, compact track loader rental, construction equipment rental New Brunswick, heavy equipment rental, excavator rental, professional contractor equipment',
  authors: [{ name: 'U-Dig It Rentals Inc.' }],
  creator: 'U-Dig It Rentals Inc.',
  publisher: 'U-Dig It Rentals Inc.',
  formatDetection: {
    email: false,
    address: false,
    telephone: true,
  },
  metadataBase: new URL('https://udigit.ca'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'U-Dig It Rentals - Professional Kubota SVL-75 Equipment Rental',
    description: 'Rent the Kubota SVL-75 compact track loader from U-Dig It Rentals. Professional equipment rental in Saint John, New Brunswick with delivery available. Licensed, insured, 24/7 support.',
    url: 'https://udigit.ca',
    siteName: 'U-Dig It Rentals',
    locale: 'en_CA',
    type: 'website',
    images: [
      {
        url: 'https://udigit.ca/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'U-Dig It Rentals - Professional Equipment Rental',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'U-Dig It Rentals - Kubota SVL-75 Equipment Rental',
    description: 'Professional compact track loader rental in Saint John, New Brunswick. Licensed, insured, and ready for your next project. Call (506) 643-1575',
    images: ['https://udigit.ca/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'construction-equipment-rental',
  other: {
    'theme-color': '#E1BC56',
    'msapplication-TileColor': '#E1BC56',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'U-Dig It Rentals',
    'application-name': 'U-Dig It Rentals',
    'format-detection': 'telephone=yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Simple Header */}
        <header className="bg-black text-white py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-yellow-400">
                U-Dig It Rentals
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="hover:text-yellow-400 transition-colors">Home</Link>
                <a href="#equipment" className="hover:text-yellow-400 transition-colors">Equipment</a>
                <a href="#booking" className="hover:text-yellow-400 transition-colors">Book Now</a>
                <a href="#insurance" className="hover:text-yellow-400 transition-colors">Insurance</a>
                <a href="#contact" className="hover:text-yellow-400 transition-colors">Contact</a>
              </nav>
              <a
                href="tel:+15066431575"
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-colors"
              >
                📞 (506) 643-1575
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Simple Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-yellow-400 font-bold text-lg mb-4">U-Dig It Rentals Inc.</h3>
                <p className="text-gray-300 mb-4">
                  Professional Kubota SVL-75 compact track loader rental service in Saint John, New Brunswick.
                </p>
                <div className="space-y-2 text-gray-300 text-sm">
                  <p>📍 945 Golden Grove Road, Saint John, NB</p>
                  <p>📞 <a href="tel:+15066431575" className="text-yellow-400 hover:underline">(506) 643-1575</a></p>
                  <p>📧 <a href="mailto:nickbaxter@udigit.ca" className="text-yellow-400 hover:underline">nickbaxter@udigit.ca</a></p>
                </div>
              </div>

              <div>
                <h3 className="text-yellow-400 font-bold text-lg mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li><Link href="/book" className="hover:text-yellow-400 transition-colors">Book Equipment</Link></li>
                  <li><Link href="/terms" className="hover:text-yellow-400 transition-colors">Terms & Conditions</Link></li>
                  <li><Link href="/getting-insurance" className="hover:text-yellow-400 transition-colors">Insurance Guide</Link></li>
                  <li><Link href="/rider" className="hover:text-yellow-400 transition-colors">Equipment Rider</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-yellow-400 font-bold text-lg mb-4">Business Hours</h3>
                <div className="text-gray-300 text-sm space-y-1">
                  <p><strong>Monday - Friday:</strong> 7:00 AM - 6:00 PM</p>
                  <p><strong>Saturday:</strong> 8:00 AM - 4:00 PM</p>
                  <p><strong>Sunday:</strong> Emergency Only</p>
                  <p className="text-yellow-400 mt-2">
                    <strong>24/7 Support</strong> during active rentals
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
              <p>&copy; 2025 U-Dig It Rentals Inc. All rights reserved. Licensed and insured for your peace of mind.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
