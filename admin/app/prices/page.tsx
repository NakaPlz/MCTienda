'use client';

import { useState, useEffect } from 'react';
import { Percent, Filter, Save, AlertTriangle } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    category: string;
    categories?: { id: number; name: string }[];
    price: number;
    discount_percentage: number;
    images: string; // JSON string
}

export default function PricesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:8000/admin/products?limit=100');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCategories = async () => {
        // We can deduce categories from products or fetch from backend if endpoint exists
        // We have /products/categories in main app, maybe admin router doesn't have it explicitly?
        // Let's assume we can get it from the products list for now or use the public one.
        try {
            const res = await fetch('http://localhost:8000/products/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (e) { console.error(e); }
    };

    const handleApplyBatch = async () => {
        if (!confirm(`¿Estás seguro de aplicar un ${discountValue}% de descuento a ${selectedCategory ? 'la categoría ' + selectedCategory : 'TODOS los productos'}?`)) {
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('http://localhost:8000/admin/products/prices/batch', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'x-admin-key': 'admin123' // Add auth if needed, currently implied local dev
                },
                body: JSON.stringify({
                    category: selectedCategory || null,
                    discount_percentage: Number(discountValue)
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessage({ type: 'success', text: `Actualizados ${data.updated_count} productos correctamente.` });
                fetchProducts(); // Refresh list
            } else {
                setMessage({ type: 'error', text: 'Error al actualizar precios' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    // Filter products for preview
    // Filter products for preview
    const filteredProducts = products.filter(p => {
        if (!selectedCategory) return true;
        // Check legacy category OR new m2m categories
        if (p.category === selectedCategory) return true;
        if (p.categories && p.categories.some(c => c.name === selectedCategory)) return true;
        return false;
    });

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-2">
                <Percent className="w-8 h-8" />
                Editor Masivo de Precios
            </h1>

            {/* Control Panel */}
            <div className="bg-card p-6 rounded-xl border border-border mb-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Filter size={20} />
                    configuración de Descuentos
                </h2>

                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium mb-2 text-gray-400">Categoría Objetivo</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-2 rounded bg-background border border-border text-foreground focus:ring-2 focus:ring-primary"
                        >
                            <option value="">-- Todas las Categorías --</option>
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium mb-2 text-gray-400">Porcentaje de Descuento (%)</label>
                        <input
                            type="number"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                            className="w-full p-2 rounded bg-background border border-border text-foreground focus:ring-2 focus:ring-primary"
                            placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Usa 0 para quitar descuentos. Valores positivos reducen el precio.
                        </p>
                    </div>

                    <button
                        onClick={handleApplyBatch}
                        disabled={loading}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-yellow-600 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Aplicando...' : (
                            <>
                                <Save size={18} />
                                Aplicar Cambios
                            </>
                        )}
                    </button>
                </div>

                {message && (
                    <div className={`mt-4 p-3 rounded flex items-center gap-2 ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                        {message.type === 'error' && <AlertTriangle size={18} />}
                        {message.text}
                    </div>
                )}
            </div>

            {/* Preview Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 bg-secondary/30 border-b border-border">
                    <h3 className="font-semibold text-gray-300">
                        Vista Previa ({filteredProducts.length} productos afectados)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-secondary/20 text-gray-400">
                            <tr>
                                <th className="p-4">SKU</th>
                                <th className="p-4">Nombre</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Precio Base</th>
                                <th className="p-4">Descuento Actual</th>
                                <th className="p-4">Precio Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredProducts.slice(0, 50).map(product => {
                                const finalPrice = product.price * (1 - product.discount_percentage / 100);
                                return (
                                    <tr key={product.id} className="hover:bg-white/5">
                                        <td className="p-4 font-mono text-sm text-gray-500">{product.id.substring(0, 8)}...</td>
                                        <td className="p-4 font-medium">{product.name}</td>
                                        <td className="p-4 text-sm text-gray-400">
                                            <div className="flex flex-wrap gap-1">
                                                {product.category && !product.categories?.some(c => c.name === product.category) && (
                                                    <span className="px-2 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700 text-xs">
                                                        {product.category} (L)
                                                    </span>
                                                )}
                                                {(product.categories || []).map(cat => (
                                                    <span key={cat.id} className="px-2 py-1 rounded-full bg-blue-900/20 text-blue-400 border border-blue-900/50 text-xs">
                                                        {cat.name}
                                                    </span>
                                                ))}
                                                {(!product.categories?.length && !product.category) && (
                                                    <span className="text-gray-600 italic">Sin Cat.</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400">${product.price.toLocaleString()}</td>
                                        <td className="p-4">
                                            {product.discount_percentage > 0 ? (
                                                <span className="text-red-400 font-bold">-{product.discount_percentage}%</span>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-green-400">
                                            ${finalPrice.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredProducts.length > 50 && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Mostrando 50 de {filteredProducts.length} productos
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
