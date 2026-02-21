'use client';

import { useState, useEffect } from 'react';
import { Ruler, Plus, Trash2, Image, FileText } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface SizeGuide {
    id: number;
    name: string;
    image_url?: string;
    content?: string;
}

export default function SizeGuidesPage() {
    const [guides, setGuides] = useState<SizeGuide[]>([]);
    const [newName, setNewName] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newContent, setNewContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchGuides();
    }, []);

    const fetchGuides = async () => {
        try {
            const res = await fetch(`${API_URL}/size-guides`);
            if (res.ok) {
                const data = await res.json();
                setGuides(data);
            }
        } catch (e) { console.error(e); }
    };

    const handleAddGuide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/size-guides`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    image_url: newImageUrl || null,
                    content: newContent || null
                })
            });

            if (res.ok) {
                setNewName('');
                setNewImageUrl('');
                setNewContent('');
                fetchGuides();
            } else {
                const err = await res.json();
                setError(err.detail || 'Error creating size guide');
            }
        } catch (e) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta guía de talles? (Asegurate de que ningún producto la esté usando)')) return;
        try {
            const res = await fetch(`${API_URL}/size-guides/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || 'Error al eliminar');
            } else {
                fetchGuides();
            }
        } catch (e) { alert('Error deleting size guide'); }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-2">
                <Ruler className="w-8 h-8" />
                Gestión de Guías de Talles
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="bg-card p-6 rounded-xl border border-border h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Nueva Guía</h2>
                    <form onSubmit={handleAddGuide} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Nombre</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full bg-background border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="Ej: Sombreros Lagomarsino"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">URL de Imagen (Opcional)</label>
                            <input
                                type="text"
                                value={newImageUrl}
                                onChange={e => setNewImageUrl(e.target.value)}
                                className="w-full bg-background border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Contenido o HTML (Opcional)</label>
                            <textarea
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                className="w-full bg-background border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary text-foreground h-24 resize-y"
                                placeholder="..."
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
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Guías Existentes</h2>

                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {guides.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No hay guías de talles creadas.
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {guides.map(guide => (
                                    <div key={guide.id} className="p-4 flex justify-between items-start hover:bg-white/5 transition gap-4">

                                        {guide.image_url ? (
                                            <img src={guide.image_url} alt={guide.name} className="w-16 h-16 object-contain bg-white rounded border border-border flex-shrink-0" />
                                        ) : (
                                            <div className="w-16 h-16 rounded border border-border bg-background flex items-center justify-center text-gray-500 flex-shrink-0">
                                                <Image size={24} />
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <h3 className="font-bold text-foreground">{guide.name}</h3>
                                            {guide.content && (
                                                <div className="text-sm text-gray-400 mt-1 flex items-start gap-1">
                                                    <FileText size={14} className="mt-0.5" /> Tiene contenido adicional
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleDelete(guide.id)}
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
