'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchCategories } from '@/lib/api';

export default function Sidebar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategories = searchParams.getAll('category');
    const currentMin = searchParams.get('min_price') || '';
    const currentMax = searchParams.get('max_price') || '';
    const currentSearch = searchParams.get('search') || '';

    const [categories, setCategories] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState(currentMin);
    const [maxPrice, setMaxPrice] = useState(currentMax);
    const [isExpanded, setIsExpanded] = useState(false); // Mobile toggle

    useEffect(() => {
        fetchCategories().then(setCategories);
    }, []);

    useEffect(() => {
        setMinPrice(currentMin);
        setMaxPrice(currentMax);
    }, [currentMin, currentMax]);

    const updateCategories = (newCategories: string[]) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('category');
        newCategories.forEach(c => params.append('category', c));
        params.set('page', '1');
        router.push(`/?${params.toString()}`, { scroll: false });
    };

    const toggleCategory = (category: string) => {
        if (currentCategories.includes(category)) {
            updateCategories(currentCategories.filter(c => c !== category));
        } else {
            updateCategories([...currentCategories, category]);
        }
    };

    const applyPriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (minPrice) params.set('min_price', minPrice); else params.delete('min_price');
        if (maxPrice) params.set('max_price', maxPrice); else params.delete('max_price');
        params.set('page', '1');
        router.push(`/?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        const params = new URLSearchParams();
        if (currentSearch) params.set('search', currentSearch); // Keep search
        router.push(`/?${params.toString()}`);
        setMinPrice('');
        setMaxPrice('');
    };

    return (
        <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 h-fit">
            {/* Mobile Toggle */}
            <div className="md:hidden flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <h3 className="text-xl font-bold text-white font-heading">Filtros</h3>
                <span className="text-primary text-xl">{isExpanded ? '▼' : '▶'}</span>
            </div>

            <div className={`${isExpanded ? 'block' : 'hidden'} md:block space-y-8`}>
                {/* Categories */}
                <div>
                    <h3 className="text-lg font-bold text-primary mb-4 font-heading border-b border-gray-700 pb-2">Categorías</h3>
                    <ul className="space-y-2">
                        {categories.map((cat) => (
                            <li key={cat}>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={currentCategories.includes(cat)}
                                            onChange={() => toggleCategory(cat)}
                                            className="peer h-4 w-4 appearance-none rounded border border-gray-600 bg-gray-900 checked:border-primary checked:bg-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                        />
                                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity font-bold" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span className={`text-sm transition-colors ${currentCategories.includes(cat) ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                        {cat}
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Price Range */}
                <div>
                    <h3 className="text-lg font-bold text-primary mb-4 font-heading border-b border-gray-700 pb-2">Precio</h3>
                    <div className="flex gap-2 items-center mb-4">
                        <input
                            type="number"
                            placeholder="Min"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                        />
                    </div>
                    <button
                        onClick={applyPriceFilter}
                        className="w-full py-2 bg-gray-800 hover:bg-primary hover:text-black text-white rounded-lg text-sm font-bold transition-colors"
                    >
                        Aplicar
                    </button>
                </div>

                {/* Clear Filters */}
                {(currentCategories.length > 0 || currentMin || currentMax) && (
                    <button
                        onClick={clearFilters}
                        className="w-full text-xs text-gray-500 hover:text-red-400 underline decoration-dashed"
                    >
                        Borrar Filtros
                    </button>
                )}
            </div>
        </div>
    );
}
