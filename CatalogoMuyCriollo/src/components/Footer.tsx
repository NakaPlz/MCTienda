"use client"

import Link from 'next/link'
import { Facebook, Instagram } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-[#1a1a1a] border-t border-border">
            {/* Main Footer Content */}
            <div className="container py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Column 1: Logo & Description */}
                    <div className="space-y-4">
                        <Link href="/" className="text-2xl font-bold">
                            <span className="text-primary">MUY</span>
                            <span className="text-white">CRIOLLO</span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Llevamos la tradición y el arte regional a cada rincón del país. Calidad garantizada en cada pieza.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Compra */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">
                            Compra
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                                    Todos los productos
                                </Link>
                            </li>
                            <li>
                                <Link href="/?filter=new" className="text-muted-foreground hover:text-primary transition-colors">
                                    Nuevos Ingresos
                                </Link>
                            </li>
                            <li>
                                <Link href="/?category=sombreros" className="text-muted-foreground hover:text-primary transition-colors">
                                    Sombreros
                                </Link>
                            </li>
                            <li>
                                <Link href="/?category=cuchilleria" className="text-muted-foreground hover:text-primary transition-colors">
                                    Cuchillería
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Soporte */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">
                            Soporte
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    Contacto
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    Envíos y Devoluciones
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    Preguntas Frecuentes
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    Términos y Condiciones
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Suscríbete */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">
                            Suscríbete
                        </h4>
                        <p className="text-muted-foreground text-sm mb-4">
                            Recibe las últimas novedades y ofertas exclusivas.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Ingresa tu email"
                                className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button className="btn btn-primary px-4 py-2 text-sm font-medium">
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border">
                <div className="container py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                    <p className="text-muted-foreground">
                        © {new Date().getFullYear()} Muy Criollo. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Medios de pago</span>
                        <span>💳</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
