import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'PulseWatch - Monitoramento Inteligente de E-commerce',
  description: 'Monitore sua loja de e-commerce 24/7 com alertas automáticos via Email e Telegram. Compatível com Shopify, WooCommerce e Nuvemshop.',
  keywords: [
    'monitoramento e-commerce',
    'alerta estoque',
    'monitoramento loja online',
    'shopify monitor',
    'woocommerce monitor',
    'nuvemshop monitor',
    'alerta vendas',
    'downtime monitor',
  ],
  authors: [{ name: 'PulseWatch' }],
  creator: 'PulseWatch',
  publisher: 'PulseWatch',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    title: 'PulseWatch - Monitoramento Inteligente de E-commerce',
    description: 'Monitore sua loja de e-commerce 24/7 com alertas automáticos via Email e Telegram.',
    siteName: 'PulseWatch',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PulseWatch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseWatch - Monitoramento Inteligente de E-commerce',
    description: 'Monitore sua loja de e-commerce 24/7 com alertas automáticos.',
    images: ['/og-image.png'],
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
