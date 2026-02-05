"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, Plus } from 'lucide-react'
import { Category } from '@/types/database'

export default function CategoriesContent() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        loadCategories()
    }, [])

    async function loadCategories() {
        const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true })
        if (data) setCategories(data)
        setLoading(false)
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim()) return

        setCreating(true)
        const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')

        const { error } = await supabase.from('categories').insert({
            name: newName.trim(),
            slug: slug
        })

        if (error) {
            alert('Error al crear: ' + error.message)
        } else {
            setNewName('')
            loadCategories()
        }
        setCreating(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return

        const { error } = await supabase.from('categories').delete().eq('id', id)
        if (error) {
            alert('Error: ' + error.message)
        } else {
            loadCategories()
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Gestionar Categorías</h1>

            <div className="bg-card p-4 rounded-lg border shadow-sm mb-8">
                <form onSubmit={handleCreate} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Nueva Categoría</label>
                        <input
                            type="text"
                            placeholder="Ej: Mates, Bombillas..."
                            className="w-full px-3 py-2 rounded-md border bg-background"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                    </div>
                    <button disabled={creating || !newName} className="btn btn-primary py-2 px-4 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {creating ? 'Creando...' : 'Agregar'}
                    </button>
                </form>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20 font-medium grid grid-cols-[1fr_1fr_auto] gap-4">
                    <div>Nombre</div>
                    <div>Slug (URL)</div>
                    <div className="text-right">Acciones</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Cargando...</div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No hay categorías creadas.</div>
                ) : (
                    <div className="divide-y">
                        {categories.map((cat) => (
                            <div key={cat.id} className="p-4 grid grid-cols-[1fr_1fr_auto] gap-4 items-center hover:bg-muted/10">
                                <div className="font-medium">{cat.name}</div>
                                <div className="text-sm text-muted-foreground font-mono">{cat.slug}</div>
                                <div className="text-right">
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
