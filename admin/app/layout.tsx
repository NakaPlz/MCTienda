import type { Metadata } from "next";
import "./globals.css";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Admin | Tienda Muy Criollo",
  description: "Panel de Administración",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="flex h-screen bg-background text-foreground font-sans">
        <AdminShell>
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
