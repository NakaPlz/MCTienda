"use client"

import Link from 'next/link'
import { ShoppingBag, Search, User } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { CartSheet } from '@/components/CartSheet'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

const NAV_LINKS = [
    { label: 'Inicio', href: '/' },
    { label: 'Sombreros', href: '/?category=sombreros' },
    { label: 'Cuchillería', href: '/?category=cuchilleria' },
    { label: 'Talabartería', href: '/?category=talabarteria' },
]

export default function NavbarContent() {
    const { totalItems } = useCart()
    const [isCartOpen, setIsCartOpen] = useState(false)
    const searchParams = useSearchParams()
    const activeCategory = searchParams.get('category')

    const isActive = (href: string) => {
        if (href === '/') {
            return !activeCategory
        }
        const categoryMatch = href.match(/category=(\w+)/)
        return categoryMatch && categoryMatch[1] === activeCategory
    }

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center font-bold text-xl tracking-tight">
                        <span className="text-primary">MUY</span>
                        <span className="text-foreground">CRIOLLO</span>
                    </Link>

                    {/* Navigation Links - Desktop */}
                    <nav className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm uppercase tracking-wider font-medium transition-colors hover:text-primary ${isActive(link.href)
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Icons */}
                    <div className="flex items-center gap-3">
                        {/* Search Icon */}
                        <button
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                            aria-label="Buscar"
                        >
                            <Search className="h-5 w-5 text-muted-foreground" />
                        </button>

                        {/* Cart Button */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="p-2 hover:bg-muted rounded-full transition-colors relative"
                            aria-label="Carrito"
                        >
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                            {totalItems > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-medium">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        {/* User Icon */}
                        <button
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                            aria-label="Usuario"
                        >
                            <User className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </header>
            <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    )
}
