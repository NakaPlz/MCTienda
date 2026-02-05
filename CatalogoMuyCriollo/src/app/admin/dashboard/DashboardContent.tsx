"use client"

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function DashboardContent() {
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        brands: 0
    })
    const [recentProducts, setRecentProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
            const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true })
            const { count: brandCount } = await supabase.from('brands').select('*', { count: 'exact', head: true })

            setStats({
                products: prodCount || 0,
                categories: catCount || 0,
                brands: brandCount || 0
            })

            const { data: recents } = await supabase
                .from('products')
                .select('id, name, price, created_at')
                .order('created_at', { ascending: false })
                .limit(5)

            if (recents) setRecentProducts(recents)
            setLoading(false)
        }

        fetchStats()
    }, [])

    if (loading) return <div className="p-8">Cargando estadísticas...</div>

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Productos</h3>
                    <p className="text-3xl font-bold">{stats.products}</p>
                </div>
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <h3 className="text-muted-foreground text-sm font-medium mb-2">Categorías</h3>
                    <p className="text-3xl font-bold">{stats.categories}</p>
                </div>
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <h3 className="text-muted-foreground text-sm font-medium mb-2">Marcas</h3>
                    <p className="text-3xl font-bold">{stats.brands}</p>
                </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20">
                    <h3 className="font-medium">Productos Recientes</h3>
                </div>
                <div className="divide-y">
                    {recentProducts.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No hay productos recientes.</div>
                    ) : (
                        recentProducts.map((prod) => (
                            <div key={prod.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                <div>
                                    <p className="font-medium">{prod.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Creado el {new Date(prod.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="font-bold">
                                    ${prod.price.toLocaleString('es-AR')}
                                </span>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-3 bg-muted/20 border-t text-center">
                    <a href="/admin/products" className="text-sm text-primary hover:underline">Ver todos los productos</a>
                </div>
            </div>
        </div>
    )
}
