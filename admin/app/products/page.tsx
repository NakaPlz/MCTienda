'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Search, Edit, Trash2 } from 'lucide-react';
import { fetchProducts } from '@/lib/api';

interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    image_url?: string;
    is_active: boolean;
    price_override?: number;
    discount_percentage?: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadProducts();
    }, [search]);

    async function loadProducts() {
        // setLoading(true); // Don't flash on every keystroke
        try {
            const data = await fetchProducts(search);
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold flex items-center gap-2 text-foreground">
                    <Package /> Productos
                </h2>
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-secondary/30 border-b border-border">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-400">Producto</th>
                            <th className="px-6 py-4 font-medium text-gray-400">SKU</th>
                            <th className="px-6 py-4 font-medium text-gray-400">Precio Base</th>
                            <th className="px-6 py-4 font-medium text-gray-400">Precio Final</th>
                            <th className="px-6 py-4 font-medium text-gray-400">Stock</th>
                            <th className="px-6 py-4 font-medium text-gray-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {products.map((product) => {
                            const finalPrice = product.price_override || (product.price * (1 - (product.discount_percentage || 0) / 100));
                            const isDiscounted = product.discount_percentage && product.discount_percentage > 0;
                            const isOverridden = product.price_override !== null && product.price_override !== undefined;

                            return (
                                <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center text-gray-400">
                                                    <Package size={16} />
                                                </div>
                                            )}
                                            <span className="font-medium text-foreground">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-sm">{product.sku}</td>
                                    <td className="px-6 py-4 text-gray-400">
                                        ${product.price.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <div className="flex flex-col">
                                            <span className={isDiscounted || isOverridden ? "text-green-400" : "text-foreground"}>
                                                ${finalPrice.toLocaleString('es-AR')}
                                            </span>
                                            {isDiscounted && <span className="text-xs text-green-400 bg-green-900/30 px-1 rounded w-fit border border-green-900">-{product.discount_percentage}%</span>}
                                            {isOverridden && <span className="text-xs text-blue-400 bg-blue-900/30 px-1 rounded w-fit border border-blue-900">Manual</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.stock > 0 ? 'bg-green-900/30 text-green-400 border border-green-900' : 'bg-red-900/30 text-red-400 border border-red-900'}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/products/${product.id}`} className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded-lg transition-colors inline-block md:mr-2">
                                            <Edit size={18} />
                                        </Link>
                                        {/* <button className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button> */}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {products.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">
                        No se encontraron productos.
                    </div>
                )}
            </div>
        </div>
    );
}
