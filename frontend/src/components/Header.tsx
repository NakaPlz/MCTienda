'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function Header() {
    const { items } = useCart();
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Link href="/" className="group">
                        <h1 className="text-2xl sm:text-3xl font-bold text-primary font-heading tracking-tight group-hover:text-yellow-500 transition-colors">Muy Criollo</h1>
                        <p className="text-xs text-gray-400 tracking-widest uppercase group-hover:text-gray-300 transition-colors">Tienda de Campo</p>
                    </Link>
                </div>

                <div className="flex items-center gap-6">
                    <Link href="/orders/track" className="text-sm font-bold text-gray-300 hover:text-primary transition-colors tracking-wider flex items-center gap-1">
                        <span className="hidden sm:inline uppercase">Seguí tu pedido</span>
                        <span className="sm:hidden text-xl" title="Seguí tu pedido">📦</span>
                    </Link>
                    <Link href="/cart" className="group relative flex items-center p-2 rounded-full hover:bg-white/5 transition-colors">
                        <div className="relative">
                            <span className="text-2xl group-hover:scale-110 transition-transform block">🛒</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-primary text-black text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full animate-in fade-in zoom-in duration-200">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
