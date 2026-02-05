'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProduct } from '@/lib/api';
import { useCart } from '@/context/CartContext';

interface Variant {
    id: number;
    sku: string;
    size: string | null;
    color: string | null;
    stock: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    variants: Variant[];
}

export default function ProductDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { addItem } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    // Resolve variant when selections change
    useEffect(() => {
        if (!product || !product.variants) return;

        const found = product.variants.find(v =>
            (v.color === selectedColor || (!v.color && !selectedColor)) &&
            (v.size === selectedSize || (!v.size && !selectedSize))
        );
        setSelectedVariant(found || null);
    }, [selectedColor, selectedSize, product]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getProduct(id)
            .then(data => {
                setProduct(data);
                if (data && data.variants && data.variants.length > 0) {
                    // Default to first variant with stock, or just first
                    const available = data.variants.find((v: Variant) => v.stock > 0);
                    setSelectedVariant(available || data.variants[0]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="text-center text-white p-20 animate-pulse">Cargando producto...</div>;
    if (!product) return <div className="text-center text-white p-20">Producto no encontrado</div>;

    const handleAddToCart = () => {
        const variantToAdd = selectedVariant;

        addItem({
            product_id: product.id,
            variant_id: variantToAdd?.id, // Optional if no variants
            sku: variantToAdd ? variantToAdd.sku : product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image_url: product.image_url,
            size: variantToAdd?.size || undefined,
            color: variantToAdd?.color || undefined
        });

        // Simple visual feedback could go here
        alert("Producto agregado al carrito!");
    };

    return (
        <div className="min-h-screen p-4 md:p-12 animate-fadeIn max-w-7xl mx-auto">
            <Link href="/" className="text-gray-400 hover:text-white mb-8 inline-block transition-colors">
                ← Volver al catálogo
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-card p-8 rounded-2xl border border-gray-800 shadow-2xl">
                {/* Image Section */}
                <div className="relative aspect-square w-full bg-gray-700 rounded-xl overflow-hidden group">
                    {product.image_url ? (
                        <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex bg-gray-800 h-full items-center justify-center text-gray-500">Sin Imagen</div>
                    )}
                </div>

                {/* Info Section */}
                <div className="flex flex-col justify-center space-y-6">
                    <div>
                        <span className="text-primary text-sm font-bold tracking-wider uppercase">{product.category || 'Producto'}</span>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 leading-tight">{product.name}</h1>
                        <p className="text-3xl text-primary font-mono font-bold mt-4">${product.price.toLocaleString()}</p>
                    </div>

                    <div className="prose prose-invert text-gray-400 leading-relaxed">
                        <p>{product.description || "Sin descripción disponible."}</p>
                    </div>

                    {/* Variants Selector - Dynamic Logic */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 space-y-6">

                            {/* Color Selector */}
                            {Array.from(new Set(product.variants.map(v => v.color).filter(Boolean))).length > 0 && (
                                <div>
                                    <h3 className="text-white font-bold mb-3">Color</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {Array.from(new Set(product.variants.map(v => v.color).filter(Boolean))).map((color) => {
                                            const isAvailable = product.variants.some(v =>
                                                v.color === color &&
                                                (selectedSize ? v.size === selectedSize : true) &&
                                                v.stock > 0
                                            );
                                            const isSelected = selectedColor === color;

                                            return (
                                                <button
                                                    key={color as string}
                                                    onClick={() => !(!isAvailable && selectedSize) && setSelectedColor(color as string)}
                                                    disabled={!isAvailable && !!selectedSize} // Only disable if filtered by other dimension
                                                    className={`px-4 py-2 rounded-lg border transition-all text-sm font-bold
                                                        ${isSelected
                                                            ? 'bg-transparent border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                            : 'bg-transparent border-gray-600 text-gray-300 hover:border-gray-400'
                                                        }
                                                        ${(!isAvailable && !!selectedSize) ? 'opacity-30 cursor-not-allowed decoration-slice line-through' : ''}
                                                    `}
                                                >
                                                    {color}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Size Selector */}
                            {Array.from(new Set(product.variants.map(v => v.size).filter(Boolean))).length > 0 && (
                                <div>
                                    <h3 className="text-white font-bold mb-3">Talle</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {Array.from(new Set(product.variants.map(v => v.size).filter(Boolean))).map((size) => {
                                            const isAvailable = product.variants.some(v =>
                                                v.size === size &&
                                                (selectedColor ? v.color === selectedColor : true) &&
                                                v.stock > 0
                                            );
                                            const isSelected = selectedSize === size;

                                            return (
                                                <button
                                                    key={size as string}
                                                    onClick={() => !(!isAvailable && selectedColor) && setSelectedSize(size as string)}
                                                    disabled={!isAvailable && !!selectedColor}
                                                    className={`w-12 h-12 rounded-lg border transition-all text-sm font-bold flex items-center justify-center
                                                        ${isSelected
                                                            ? 'bg-transparent border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                            : 'bg-transparent border-gray-600 text-gray-300 hover:border-gray-400'
                                                        }
                                                        ${(!isAvailable && !!selectedColor) ? 'opacity-30 cursor-not-allowed line-through' : ''}
                                                    `}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Stock Display */}
                            {selectedVariant ? (
                                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 font-mono text-sm">
                                    Stock disponible: <span className="font-bold text-lg">{selectedVariant.stock}</span> unidades
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic">
                                    Selecciona variaciones para ver stock
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 px-8 py-4 bg-primary text-black font-bold rounded-xl hover:bg-yellow-500 transition-all transform hover:-translate-y-1 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">🛒</span> Agregar al Carrito
                        </button>
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-4 justify-center">
                        <span className="flex items-center gap-1">🔒 Compra Segura</span>
                        <span className="flex items-center gap-1">🚚 Envíos a todo el país</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
