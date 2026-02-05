"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types/database'
import { ProductCard } from '@/components/ProductCard'

interface RelatedProductsProps {
    categoryId: string
    currentProductId: string
}

export function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchRelated() {
            if (!categoryId) return

            const { data } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (id, name),
                    brands (id, name),
                    product_images (url, display_order)
                `)
                .eq('category_id', categoryId)
                .neq('id', currentProductId) // Exclude current
                .eq('active', true)
                .limit(4)

            if (data) {
                setProducts(data as any)
            }
            setLoading(false)
        }

        fetchRelated()
    }, [categoryId, currentProductId])

    if (loading || products.length === 0) return null

    return (
        <div className="mt-16 border-t pt-10">
            <h2 className="text-2xl font-bold mb-6 text-primary">Productos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}
