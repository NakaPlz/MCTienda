'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { fetchConfig } from '@/lib/api';

export default function CartPage() {
    const { items, total, updateQuantity, removeItem } = useCart();
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(55000);

    useEffect(() => {
        fetchConfig().then(config => {
            if (config.free_shipping_threshold) {
                setFreeShippingThreshold(config.free_shipping_threshold);
            }
        });
    }, []);

    const missingForFreeShipping = freeShippingThreshold - total;
    const progressPercentage = Math.min((total / freeShippingThreshold) * 100, 100);

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🛒</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Tu carrito está vacío</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    ¡Tenemos un montón de productos de campo esperando por vos!
                </p>
                <Link href="/" className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-yellow-500 transition-all">
                    Ir a la Tienda
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4">
                Tu Carrito ({items.length} productos)
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product List */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="bg-card p-4 rounded-xl border border-gray-800 flex gap-4 items-center">
                            <div className="relative w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                {item.image_url ? (
                                    <Image
                                        src={item.image_url}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs text-gray-500">Sin Foto</div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg">{item.name}</h3>
                                {item.attributes ? (
                                    <p className="text-sm text-gray-400">
                                        {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                    </p>
                                ) : (item.size || item.color) ? (
                                    <p className="text-sm text-gray-400">
                                        {item.size && `Talle: ${item.size}`} {item.color && `| Color: ${item.color}`}
                                    </p>
                                ) : null}
                                <p className="text-primary font-mono">${item.price.toLocaleString()}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700">
                                    <button
                                        onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                        disabled={item.quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center text-white font-bold text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeItem(item.product_id, item.variant_id)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Eliminar producto"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary & Shipping Progress */}
                <div className="space-y-6">
                    {/* Free Shipping Progress */}
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-primary/20">
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            🚀 Envío Gratis
                        </h3>

                        <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>

                        {missingForFreeShipping > 0 ? (
                            <p className="text-sm text-gray-300">
                                Te faltan <span className="text-primary font-bold">${missingForFreeShipping.toLocaleString()}</span> para el envío gratis.
                                <br />
                                <Link href="/" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                                    ¡Agregar más productos!
                                </Link>
                            </p>
                        ) : (
                            <p className="text-sm text-green-400 font-bold flex items-center gap-2">
                                🎉 ¡Genial! Tienes Envío Gratis.
                            </p>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-card p-6 rounded-xl border border-gray-800">
                        <h3 className="text-xl font-bold text-white mb-4">Resumen</h3>

                        <div className="space-y-2 mb-6 text-sm">
                            <div className="flex justify-between text-gray-400">
                                <span>Subtotal</span>
                                <span>${total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Envío</span>
                                {total >= freeShippingThreshold ? (
                                    <span className="text-green-500">Gratis</span>
                                ) : (
                                    <span>Por calcular</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xl font-bold text-white mb-6 pt-4 border-t border-gray-800">
                            <span>Total</span>
                            <span>${total.toLocaleString()}</span>
                        </div>

                        <Link
                            href="/checkout"
                            className="block w-full text-center py-4 bg-primary text-black font-bold rounded-xl hover:bg-yellow-500 transition-all shadow-lg shadow-primary/20"
                        >
                            Finalizar Compra
                        </Link>

                        <div className="mt-4 text-center">
                            <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
                                Seguir viendo productos
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
