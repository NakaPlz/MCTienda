"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, Plus } from 'lucide-react'
import { Brand } from '@/types/database'

export default function BrandsContent() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        loadBrands()
    }, [])

    async function loadBrands() {
        const { data } = await supabase.from('brands').select('*').order('created_at', { ascending: true })
        if (data) setBrands(data)
        setLoading(false)
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim()) return

        setCreating(true)

        const { error } = await supabase.from('brands').insert({
            name: newName.trim(),
        })

        if (error) {
            alert('Error al crear: ' + error.message)
        } else {
            setNewName('')
            loadBrands()
        }
        setCreating(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Seguro que deseas eliminar esta marca?')) return

        const { error } = await supabase.from('brands').delete().eq('id', id)
        if (error) {
            alert('Error: ' + error.message)
        } else {
            loadBrands()
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Gestionar Marcas</h1>

            {/* Create Form */}
            <div className="bg-card p-4 rounded-lg border shadow-sm mb-8">
                <form onSubmit={handleCreate} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Nueva Marca</label>
                        <input
                            type="text"
                            placeholder="Ej: Stanley, Lumilagro..."
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

            {/* List */}
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20 font-medium grid grid-cols-[1fr_auto] gap-4">
                    <div>Nombre</div>
                    <div className="text-right">Acciones</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Cargando...</div>
                ) : brands.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No hay marcas creadas.</div>
                ) : (
                    <div className="divide-y">
                        {brands.map((brand) => (
                            <div key={brand.id} className="p-4 grid grid-cols-[1fr_auto] gap-4 items-center hover:bg-muted/10">
                                <div className="font-medium">{brand.name}</div>
                                <div className="text-right">
                                    <button
                                        onClick={() => handleDelete(brand.id)}
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
