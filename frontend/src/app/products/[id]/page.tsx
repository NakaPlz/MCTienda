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
                    const target = available || data.variants[0];

                    // Sync all states so the UI reflects the default selection
                    setSelectedColor(target.color);
                    setSelectedSize(target.size);
                    setSelectedVariant(target);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="text-center text-white p-20 animate-pulse">Cargando producto...</div>;
    if (!product) return <div className="text-center text-white p-20">Producto no encontrado</div>;

    const handleAddToCart = () => {
        if (product.variants && product.variants.length > 0 && !selectedVariant) {
            alert("Por favor selecciona las opciones (Color/Talle) antes de agregar.");
            return;
        }

        const variantToAdd = selectedVariant;

        addItem({
            product_id: product.id,
            variant_id: variantToAdd?.id,
            sku: variantToAdd ? variantToAdd.sku : product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image_url: product.image_url,
            size: variantToAdd?.size || undefined,
            color: variantToAdd?.color || undefined
        });

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
                        <p>
                            {product.description && !product.description.includes("Importado de Mercado Libre")
                                ? product.description
                                : ""}
                        </p>
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
                                            // 1. Is this color available at all for this product?
                                            const hasAnyStock = product.variants.some(v => v.color === color && v.stock > 0);

                                            // 2. Is it available with the CURRENT size?
                                            const isCompatible = !selectedSize || product.variants.some(v =>
                                                v.color === color && v.size === selectedSize && v.stock > 0
                                            );

                                            const isSelected = selectedColor === color;

                                            return (
                                                <button
                                                    key={color as string}
                                                    onClick={() => {
                                                        if (!hasAnyStock) return;

                                                        if (isSelected) {
                                                            // Toggle OFF
                                                            setSelectedColor(null);
                                                        } else {
                                                            // Toggle ON
                                                            setSelectedColor(color as string);
                                                            // If not compatible with current size, reset size
                                                            if (!isCompatible) setSelectedSize(null);
                                                        }
                                                    }}
                                                    disabled={!hasAnyStock}
                                                    className={`px-4 py-2 rounded-lg border transition-all text-sm font-bold
                                                        ${isSelected
                                                            ? 'bg-transparent border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                            : 'bg-transparent border-gray-600 text-gray-300 hover:border-gray-400'
                                                        }
                                                        ${!hasAnyStock ? 'opacity-30 cursor-not-allowed decoration-slice line-through' : ''}
                                                        ${(!isSelected && !isCompatible && hasAnyStock) ? 'opacity-60 border-dashed' : ''} 
                                                    `}
                                                    title={!isCompatible && hasAnyStock ? "Esta opción cambiará el talle seleccionado" : ""}
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
                                            // 1. Is this size available at all?
                                            const hasAnyStock = product.variants.some(v => v.size === size && v.stock > 0);

                                            // 2. Is it available with CURRENT color?
                                            const isCompatible = !selectedColor || product.variants.some(v =>
                                                v.size === size && v.color === selectedColor && v.stock > 0
                                            );

                                            const isSelected = selectedSize === size;

                                            return (
                                                <button
                                                    key={size as string}
                                                    onClick={() => {
                                                        if (!hasAnyStock) return;

                                                        if (isSelected) {
                                                            setSelectedSize(null);
                                                        } else {
                                                            setSelectedSize(size as string);
                                                            if (!isCompatible) setSelectedColor(null);
                                                        }
                                                    }}
                                                    disabled={!hasAnyStock}
                                                    className={`w-12 h-12 rounded-lg border transition-all text-sm font-bold flex items-center justify-center
                                                        ${isSelected
                                                            ? 'bg-transparent border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                            : 'bg-transparent border-gray-600 text-gray-300 hover:border-gray-400'
                                                        }
                                                        ${!hasAnyStock ? 'opacity-30 cursor-not-allowed line-through' : ''}
                                                        ${(!isSelected && !isCompatible && hasAnyStock) ? 'opacity-60 border-dashed' : ''}
                                                    `}
                                                    title={!isCompatible && hasAnyStock ? "Esta opción cambiará el color seleccionado" : ""}
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
