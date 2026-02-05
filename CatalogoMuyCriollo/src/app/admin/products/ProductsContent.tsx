"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types/database'
import { Edit, Trash2, Plus } from 'lucide-react'

export default function ProductsContent() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        const { data, error } = await supabase
            .from('products')
            .select(`*, categories(name), brands(name)`)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })

        if (data) setProducts(data as any)
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return

        const { error } = await supabase.from('products').delete().eq('id', id)
        if (!error) {
            setProducts(products.filter(p => p.id !== id))
        } else {
            alert('Error al eliminar')
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Publicaciones</h1>
                <a href="/admin/products/new" className="btn btn-primary gap-2 flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Nueva Publicación
                </a>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="p-4 font-medium">Prioridad</th>
                            <th className="p-4 font-medium">Nombre</th>
                            <th className="p-4 font-medium">Categoría</th>
                            <th className="p-4 font-medium">Marca</th>
                            <th className="p-4 font-medium">Precio</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center">Cargando...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay productos.</td></tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/10">
                                    <td className="p-4 font-medium text-muted-foreground">{product.priority || 0}</td>
                                    <td className="p-4 font-medium">{product.name}</td>
                                    <td className="p-4 text-muted-foreground">{product.categories?.name || '-'}</td>
                                    <td className="p-4 text-muted-foreground">{product.brands?.name || '-'}</td>
                                    <td className="p-4">${product.price.toLocaleString('es-AR')}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <a href={`/admin/products/edit?id=${product.id}`} className="p-2 hover:bg-muted rounded text-foreground">
                                                <Edit className="h-4 w-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 hover:bg-destructive/10 text-destructive rounded"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
