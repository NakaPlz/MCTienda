"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronRight, Save } from 'lucide-react'

export default function StockContent() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const { data } = await supabase
            .from('products')
            .select(`
                id, name, stock, 
                product_variants(id),
                product_combinations(id, attributes, stock)
            `)
            .order('name', { ascending: true })

        if (data) setProducts(data)
        setLoading(false)
    }

    const toggleExpand = (id: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const updateStock = async (productId: string, combinationId: string | null, newStock: string) => {
        const val = parseInt(newStock)
        if (isNaN(val)) return

        setUpdating(combinationId || productId)

        try {
            if (combinationId) {
                await supabase
                    .from('product_combinations')
                    .update({ stock: val })
                    .eq('id', combinationId)

                setProducts(prev => prev.map(p => {
                    if (p.id === productId) {
                        const newCombos = p.product_combinations.map((c: any) =>
                            c.id === combinationId ? { ...c, stock: val } : c
                        )
                        const newTotal = newCombos.reduce((acc: number, c: any) => acc + c.stock, 0)
                        supabase.from('products').update({ stock: newTotal }).eq('id', productId).then()
                        return { ...p, stock: newTotal, product_combinations: newCombos }
                    }
                    return p
                }))
            } else {
                await supabase
                    .from('products')
                    .update({ stock: val })
                    .eq('id', productId)

                setProducts(prev => prev.map(p =>
                    p.id === productId ? { ...p, stock: val } : p
                ))
            }
        } catch (error) {
            console.error(error)
            alert("Error al actualizar stock")
        } finally {
            setUpdating(null)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Control de Stock</h1>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 border-b bg-muted/20 font-medium">
                    <div className="w-8"></div>
                    <div>Producto</div>
                    <div className="w-32 text-right">Stock Total</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Cargando...</div>
                ) : (
                    <div className="divide-y">
                        {products.map(p => {
                            const hasCombinations = p.product_combinations && p.product_combinations.length > 0;
                            const isExpanded = expandedRows[p.id];

                            return (
                                <div key={p.id} className="group">
                                    <div className={`grid grid-cols-[auto_1fr_auto] gap-4 p-4 items-center hover:bg-muted/5 transition-colors ${isExpanded ? 'bg-muted/5' : ''}`}>
                                        <div className="w-8 flex justify-center">
                                            {hasCombinations && (
                                                <button onClick={() => toggleExpand(p.id)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                </button>
                                            )}
                                        </div>
                                        <div className="font-medium">{p.name}</div>
                                        <div className="w-32 flex justify-end">
                                            {hasCombinations ? (
                                                <span className="font-bold text-lg">{p.stock}</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-20 px-2 py-1 text-right border rounded bg-background text-foreground"
                                                        defaultValue={p.stock}
                                                        onBlur={(e) => updateStock(p.id, null, e.target.value)}
                                                    />
                                                    {updating === p.id && <Save className="h-3 w-3 animate-pulse text-primary" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded && hasCombinations && (
                                        <div className="bg-muted/10 border-t border-b px-12 py-4">
                                            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">Variantes</div>
                                            <div className="space-y-2">
                                                {p.product_combinations.map((c: any) => (
                                                    <div key={c.id} className="flex items-center justify-between p-2 bg-background border rounded-md max-w-md ml-auto">
                                                        <div className="text-sm flex gap-2">
                                                            {Object.entries(c.attributes).map(([k, v]) => (
                                                                <span key={k} className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                                                    {k}: <span className="font-medium">{v as string}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                className="w-16 px-2 py-1 text-right border rounded text-sm bg-background text-foreground"
                                                                defaultValue={c.stock}
                                                                onBlur={(e) => updateStock(p.id, c.id, e.target.value)}
                                                            />
                                                            <div className="w-4">
                                                                {updating === c.id && <Save className="h-3 w-3 animate-pulse text-primary" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
