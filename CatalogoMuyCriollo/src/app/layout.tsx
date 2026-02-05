import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartProvider } from '@/context/CartContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muy Criollo - Catálogo',
  description: 'Catálogo de productos regionales de primera calidad',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <CartProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
