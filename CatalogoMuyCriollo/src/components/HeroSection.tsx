"use client"

import Link from 'next/link'

export function HeroSection() {
    return (
        <section className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] py-20 md:py-28">
            {/* Background overlay pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_1px,_transparent_1px)] bg-[length:20px_20px]" />
            </div>

            <div className="container relative z-10 text-center">
                {/* Subtitle */}
                <p className="text-primary font-medium italic tracking-wide mb-4">
                    Tradición y Elegancia
                </p>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                    Artesanía Regional<br />
                    Hecha con Pasión
                </h1>

                {/* Description */}
                <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-sm md:text-base">
                    Descubra nuestra selección exclusiva de productos elaborados por manos expertas.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="#productos"
                        className="btn btn-primary px-8 py-3 text-sm uppercase tracking-wider font-semibold"
                    >
                        Ver Colección
                    </Link>
                    <button
                        className="btn btn-outline border-white/30 text-white hover:bg-white/10 px-8 py-3 text-sm uppercase tracking-wider font-semibold"
                        disabled
                    >
                        Nuestra Historia
                    </button>
                </div>
            </div>
        </section>
    )
}
