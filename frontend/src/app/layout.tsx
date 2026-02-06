import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

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
      <head>
        {/* Google Fonts - Loaded at runtime to avoid build-time network errors in restricted environments */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --font-lato: 'Lato', sans-serif;
            --font-playfair: 'Playfair Display', serif;
          }
        `}</style>
      </head>
      <body
        className={`font-body antialiased bg-background text-foreground`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}

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
