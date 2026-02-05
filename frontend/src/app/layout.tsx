import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Muy Criollo | Tienda de Campo Argentina",
  description: "Lo mejor de nuestra tradición. Sombreros, Boinas, Cuchillos y artículos regionales de alta calidad. Envíos a todo el país.",
  keywords: ["campo", "sombreros", "boinas", "cuchillos", "regional", "argentina", "muy criollo"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${playfair.variable} ${lato.variable} antialiased bg-background text-foreground font-body`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
