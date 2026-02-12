'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Save, X } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    description?: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:8000/admin/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (e) { console.error(e); }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:8000/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCatName, description: newCatDesc })
            });

            if (res.ok) {
                setNewCatName('');
                setNewCatDesc('');
                fetchCategories();
            } else {
                const err = await res.json();
                setError(err.detail || 'Error creating category');
            }
        } catch (e) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta categoría?')) return;
        try {
            await fetch(`http://localhost:8000/admin/categories/${id}`, { method: 'DELETE' });
            fetchCategories();
        } catch (e) { alert('Error deleting category'); }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-2">
                <Tag className="w-8 h-8" />
                Gestión de Categorías
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="bg-card p-6 rounded-xl border border-border h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Nueva Categoría</h2>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Nombre</label>
                            <input
                                type="text"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                className="w-full bg-background border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="Ej: Mates"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Descripción (Opcional)</label>
                            <textarea
                                value={newCatDesc}
                                onChange={e => setNewCatDesc(e.target.value)}
                                className="w-full bg-background border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary text-foreground h-24 resize-none"
                                placeholder="Descripción corta..."
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-bold hover:bg-yellow-600 transition disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading ? 'Guardando...' : <><Plus size={18} /> Crear</>}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Categorías Existentes</h2>

                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {categories.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No hay categorías creadas.
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {categories.map(cat => (
                                    <div key={cat.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition">
                                        <div>
                                            <h3 className="font-bold text-foreground">{cat.name}</h3>
                                            {cat.description && <p className="text-sm text-gray-400">{cat.description}</p>}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="p-2 text-gray-500 hover:text-red-400 transition"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
