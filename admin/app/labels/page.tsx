'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { API_URL } from '@/lib/api';

interface Label {
    id: number;
    name: string;
    color: string;
}

export default function LabelsPage() {
    const { token } = useAuth();
    const [labels, setLabels] = useState<Label[]>([]);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#000000');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) fetchLabels();
    }, [token]);

    const fetchLabels = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/labels`, {
                headers: { 'x-admin-key': token || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setLabels(data);
            }
        } catch (e) { console.error(e); }
    };

    const handleAddLabel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabelName.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/admin/labels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': token || ''
                },
                body: JSON.stringify({ name: newLabelName, color: newLabelColor })
            });

            if (res.ok) {
                setNewLabelName('');
                setNewLabelColor('#000000');
                fetchLabels();
            } else {
                const err = await res.json();
                setError(err.detail || 'Error creating label');
            }
        } catch (e) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta etiqueta?')) return;
        try {
            const res = await fetch(`${API_URL}/admin/labels/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': token || '' }
            });
            if (res.ok) {
                fetchLabels();
            } else {
                alert('Error removing label');
            }
        } catch (e) { alert('Error removing label'); }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-2">
                <Tag className="w-8 h-8" />
                Gestión de Etiquetas
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="bg-card p-6 rounded-xl border border-border h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Nueva Etiqueta</h2>
                    <form onSubmit={handleAddLabel} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Nombre</label>
                            <input
                                type="text"
                                value={newLabelName}
                                onChange={e => setNewLabelName(e.target.value)}
                                className="w-full bg-background border border-border rounded px-3 py-2 focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="Ej: Oferta"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Color</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={newLabelColor}
                                    onChange={e => setNewLabelColor(e.target.value)}
                                    className="h-10 w-10 bg-transparent border-0 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={newLabelColor}
                                    onChange={e => setNewLabelColor(e.target.value)}
                                    className="flex-1 bg-background border border-border rounded px-3 py-2 text-foreground uppercase"
                                    maxLength={7}
                                />
                            </div>
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
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Etiquetas Existentes</h2>

                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {labels.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No hay etiquetas creadas.
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {labels.map(label => (
                                    <div key={label.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-6 h-6 rounded-full border border-gray-600"
                                                style={{ backgroundColor: label.color }}
                                            />
                                            <div>
                                                <h3 className="font-bold text-foreground">{label.name}</h3>
                                                <p className="text-xs text-gray-500 uppercase">{label.color}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(label.id)}
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