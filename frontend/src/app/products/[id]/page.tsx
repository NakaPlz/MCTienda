'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Ruler, X } from 'lucide-react';
import { getProduct } from '@/lib/api';
import { useCart } from '@/context/CartContext';

interface Variant {
    id: number;
    sku: string;
    size?: string | null;  // Deprecated
    color?: string | null; // Deprecated
    attributes?: Record<string, string> | null;
    stock: number;
}

interface SizeGuide {
    id: number;
    name: string;
    image_url?: string;
    content?: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    image_url: string;
    images?: string[];
    category: string;
    variants: Variant[];
    size_guide?: SizeGuide;
    price_override?: number | null;
    discount_percentage?: number;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { addItem } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

    // Dynamic attributes state: { "Color": "Rojo", "Talle": "M" }
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

    const [mainImage, setMainImage] = useState<string | null>(null);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    // Resolve variant when selections change
    useEffect(() => {
        if (!product || !product.variants || product.variants.length === 0) return;

        // Find the variant that matches ALL selected attributes
        const found = product.variants.find(v => {
            if (!v.attributes) return false;

            // Check if every selected attribute matches the variant's attributes
            for (const [key, value] of Object.entries(selectedAttributes)) {
                if (v.attributes[key] !== value) {
                    return false;
                }
            }

            // Also ensure we have selected ALL required attributes for this to be a complete match
            // (Optional depending on business logic, but good practice to ensure exact match)
            // For now, if all currently selected match, it's a potential match. Let's return the first one.
            return Object.keys(selectedAttributes).length === Object.keys(v.attributes).length;
        });

        setSelectedVariant(found || null);
    }, [selectedAttributes, product]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getProduct(id)
            .then(data => {
                setProduct(data);
                if (data) {
                    setMainImage(data.image_url);
                    if (data.variants && data.variants.length > 0) {
                        // Default to first variant with stock, or just first
                        const available = data.variants.find((v: Variant) => v.stock > 0);
                        const target = available || data.variants[0];

                        // Sync all states so the UI reflects the default selection
                        if (target.attributes) {
                            setSelectedAttributes(target.attributes);
                        } else {
                            // Fallback for legacy items without attributes
                            const legacyAttrs: Record<string, string> = {};
                            if (target.color) legacyAttrs["Color"] = target.color;
                            if (target.size) legacyAttrs["Talle"] = target.size;
                            setSelectedAttributes(legacyAttrs);
                        }
                        setSelectedVariant(target);
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="text-center text-white p-20 animate-pulse">Cargando producto...</div>;
    if (!product) return <div className="text-center text-white p-20">Producto no encontrado</div>;

    // --- Price Logic ---
    const originalPrice = product.price;
    const hasOverride = product.price_override !== null && product.price_override !== undefined;
    const hasPercentage = (product.discount_percentage ?? 0) !== 0;

    let finalPrice = originalPrice;
    if (hasOverride) {
        finalPrice = product.price_override!;
    } else if (hasPercentage) {
        finalPrice = originalPrice * (1 - (product.discount_percentage! / 100));
    }
    finalPrice = Math.round(finalPrice);

    // Only show discount styling when price actually went DOWN
    const isDiscounted = finalPrice < originalPrice;
    const hasDiscount = (product.discount_percentage ?? 0) > 0;

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
            price: finalPrice,
            quantity: 1,
            stock: variantToAdd ? variantToAdd.stock : (product.stock || 0),
            image_url: product.image_url,
            // For cart display, we can serialize the attributes or pass them raw
            attributes: selectedVariant?.attributes || undefined,
            // Fallbacks for legacy/carts
            size: selectedVariant?.attributes?.['Talle'] || selectedVariant?.size || undefined,
            color: selectedVariant?.attributes?.['Color'] || selectedVariant?.color || undefined
        });

        alert("Producto agregado al carrito!");
    };

    // Use mainImage or fallback to product.image_url
    const currentImage = mainImage || product.image_url;
    // Combine main image + extra images for gallery, filtering duplicates
    const galleryImages = [product.image_url, ...(product.images || [])].filter((v, i, a) => v && a.indexOf(v) === i);

    return (
        <div className="min-h-screen p-4 md:p-12 animate-fadeIn max-w-7xl mx-auto">
            <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white mb-8 inline-flex items-center gap-2 transition-colors hover:-translate-x-1 duration-300"
            >
                ← Volver
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-card p-8 rounded-2xl border border-gray-800 shadow-2xl">
                {/* Image Section (Gallery) */}
                <div className="flex flex-col gap-4">
                    <div className="relative aspect-square w-full bg-white rounded-xl overflow-hidden group border border-border">
                        {currentImage ? (
                            <Image
                                src={currentImage}
                                alt={product.name}
                                fill
                                className="object-contain p-4 transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="flex bg-gray-800 h-full items-center justify-center text-gray-500">Sin Imagen</div>
                        )}
                    </div>
                    {/* Thumbnails */}
                    {galleryImages.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {galleryImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setMainImage(img)}
                                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all
                                        ${mainImage === img ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <Image src={img!} alt={`Ver imagen ${idx + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="flex flex-col justify-center space-y-6">
                    <div>
                        <span className="text-primary text-sm font-bold tracking-wider uppercase">{product.category || 'Producto'}</span>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 leading-tight">{product.name}</h1>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {isDiscounted && (
                                <p className="text-xl text-gray-500 font-mono line-through">${originalPrice.toLocaleString()}</p>
                            )}
                            <p className={`text-3xl font-mono font-bold ${isDiscounted ? 'text-green-400' : 'text-primary'}`}>${finalPrice.toLocaleString()}</p>
                            {isDiscounted && hasDiscount && (
                                <span className="bg-green-600 text-white text-sm font-bold px-2 py-1 rounded">
                                    -{product.discount_percentage}%
                                </span>
                            )}
                            {isDiscounted && hasOverride && !hasDiscount && (
                                <span className="bg-green-600 text-white text-sm font-bold px-2 py-1 rounded">
                                    OFERTA
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="prose prose-invert text-gray-400 leading-relaxed whitespace-pre-line">
                        <p>
                            {product.description && !product.description.includes("Importado de Mercado Libre")
                                ? product.description
                                : ""}
                        </p>
                    </div>

                    {product.size_guide && (
                        <div>
                            <button
                                onClick={() => setIsSizeGuideOpen(true)}
                                className="flex items-center gap-2 text-primary hover:text-yellow-400 font-bold transition-colors bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg border border-primary/20 w-fit"
                            >
                                <Ruler size={18} /> Ver tabla de medidas
                            </button>
                        </div>
                    )}

                    {/* Variants Selector - Dynamic Logic */}
                    {product.variants && product.variants.length > 0 && (() => {
                        // 1. Extract all unique attribute keys (e.g., ['Color', 'Talle', 'Diseño de la tela'])
                        const allKeys = new Set<string>();
                        product.variants.forEach(v => {
                            if (v.attributes) {
                                Object.keys(v.attributes).forEach(k => allKeys.add(k));
                            } else {
                                // Fallback mapping for legacy variants
                                if (v.color) allKeys.add("Color");
                                if (v.size) allKeys.add("Talle");
                            }
                        });

                        const attributeKeys = Array.from(allKeys);

                        if (attributeKeys.length === 0) return null;

                        return (
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 space-y-6">
                                {attributeKeys.map(attrKey => {
                                    // 2. Extract all unique values for this specific attribute key
                                    const uniqueValues = Array.from(new Set(
                                        product.variants.map(v => {
                                            if (v.attributes) return v.attributes[attrKey];
                                            if (attrKey === "Color") return v.color;
                                            if (attrKey === "Talle") return v.size;
                                            return undefined;
                                        }).filter(Boolean) as string[]
                                    ));

                                    if (uniqueValues.length === 0) return null;

                                    return (
                                        <div key={attrKey}>
                                            <h3 className="text-white font-bold mb-3">{attrKey}</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {uniqueValues.map(val => {
                                                    // 1. Is this specific variation value available at all in the product?
                                                    const hasAnyStock = product.variants.some(v => {
                                                        const vVal = v.attributes ? v.attributes[attrKey] : (attrKey === "Color" ? v.color : (attrKey === "Talle" ? v.size : undefined));
                                                        return vVal === val && v.stock > 0;
                                                    });

                                                    // 2. Is it compatible with the *other* currently selected attributes?
                                                    const isCompatible = product.variants.some(v => {
                                                        const vVal = v.attributes ? v.attributes[attrKey] : (attrKey === "Color" ? v.color : (attrKey === "Talle" ? v.size : undefined));
                                                        if (vVal !== val || v.stock <= 0) return false;

                                                        // Check against other selected attributes
                                                        for (const [sKey, sVal] of Object.entries(selectedAttributes)) {
                                                            if (sKey === attrKey) continue; // Skip checking against itself
                                                            const vsVal = v.attributes ? v.attributes[sKey] : (sKey === "Color" ? v.color : (sKey === "Talle" ? v.size : undefined));
                                                            if (vsVal !== sVal) return false;
                                                        }
                                                        return true;
                                                    });

                                                    const isSelected = selectedAttributes[attrKey] === val;

                                                    return (
                                                        <button
                                                            key={val}
                                                            onClick={() => {
                                                                if (!hasAnyStock) return;

                                                                setSelectedAttributes(prev => {
                                                                    const next = { ...prev };
                                                                    if (isSelected) {
                                                                        delete next[attrKey];
                                                                    } else {
                                                                        next[attrKey] = val;
                                                                    }

                                                                    // If the new selection is incompatible with some OTHER selections,
                                                                    // we should ideally reset the incompatible ones. For simplicity,
                                                                    // if user clicks an incompatible but in-stock choice, we clear everything 
                                                                    // else and just select this one to prevent getting stuck.
                                                                    if (!isCompatible && !isSelected) {
                                                                        return { [attrKey]: val };
                                                                    }

                                                                    return next;
                                                                });
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
                                                            title={!isCompatible && hasAnyStock ? "Esta opción cambiará las otras selecciones" : ""}
                                                        >
                                                            {val}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

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
                        );
                    })()}

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

            {/* Size Guide Modal */}
            {isSizeGuideOpen && product.size_guide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
                    <div className="bg-card w-full max-w-2xl rounded-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/50">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Ruler className="text-primary" /> {product.size_guide.name}</h3>
                            <button onClick={() => setIsSizeGuideOpen(false)} className="text-gray-400 hover:text-white transition p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {product.size_guide.image_url && (
                                <div className="mb-6 border border-border rounded-xl overflow-hidden bg-white flex justify-center p-4">
                                    <img src={product.size_guide.image_url} alt={product.size_guide.name} className="max-w-full h-auto object-contain max-h-[60vh] rounded" />
                                </div>
                            )}
                            {product.size_guide.content && (
                                <div className="prose prose-invert whitespace-pre-line text-gray-300">
                                    {product.size_guide.content}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-border flex justify-end bg-secondary/50">
                            <button onClick={() => setIsSizeGuideOpen(false)} className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-yellow-500 transition">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
