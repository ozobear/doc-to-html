import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Doc to HTML Converter - Convierte Documentos a HTML Gratis",
    template: "%s | Doc to HTML Converter"
  },
  description: "Convierte tus documentos Word, Excel, PDF y más a HTML de forma gratuita y segura. Procesamiento rápido, sin registro requerido para archivos pequeños.",
  keywords: ["conversión documentos", "HTML converter", "Word a HTML", "Excel a HTML", "PDF a HTML", "convertidor online", "documentos web", "gratis"],
  authors: [{ name: "Doc to HTML Converter" }],
  creator: "Doc to HTML Converter",
  publisher: "Doc to HTML Converter",
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
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://your-domain.vercel.app',
    siteName: 'Doc to HTML Converter',
    title: 'Doc to HTML Converter - Convierte Documentos a HTML Gratis',
    description: 'Convierte tus documentos Word, Excel, PDF y más a HTML de forma gratuita y segura.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Doc to HTML Converter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Doc to HTML Converter - Convierte Documentos a HTML Gratis',
    description: 'Convierte tus documentos Word, Excel, PDF y más a HTML de forma gratuita y segura.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'google-site-verification-code', // Reemplazar con código real
  },
  alternates: {
    canonical: 'https://your-domain.vercel.app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
