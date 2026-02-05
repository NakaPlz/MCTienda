"use client"

import { supabase } from '@/lib/supabase'
import { ProductGallery } from './components/ProductGallery'
import { ProductInfo } from './components/ProductInfo'
import { Product } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { RelatedProducts } from './components/RelatedProducts'

export default function ProductDetailContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProduct() {
            if (!id) return;

            const { data, error } = await supabase
                .from('products')
                .select(`
          *,
          categories (name),
          brands (name),
          product_images (id, url, display_order),
          product_variants (id, type, value, stock),
          product_combinations (id, attributes, stock)
        `)
                .eq('id', id)
                .single()

            if (!error && data) {
                setProduct(data as any)
            }
            setLoading(false)
        }

        fetchProduct()
    }, [id])

    if (loading) {
        return <div className="container py-20 text-center">Cargando producto...</div>
    }

    if (!product) {
        return <div className="container py-20 text-center text-muted-foreground">Producto no encontrado</div>
    }

    return (
        <div className="container py-10">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <ProductGallery images={product.product_images || []} />
                <ProductInfo product={product} />
            </div>

            {/* Related Products */}
            {product.category_id && (
                <RelatedProducts categoryId={product.category_id} currentProductId={product.id} />
            )}

            {/* SEO Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org/",
                        "@type": "Product",
                        "name": product.name,
                        "image": product.product_images?.[0]?.url ? [product.product_images[0].url] : [],
                        "description": product.description || `Comprá ${product.name} en Catálogo Muy Criollo`,
                        "brand": {
                            "@type": "Brand",
                            "name": product.brands?.name || "Muy Criollo"
                        },
                        "offers": {
                            "@type": "Offer",
                            "url": typeof window !== 'undefined' ? window.location.href : '',
                            "priceCurrency": "ARS",
                            "price": product.price,
                            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                        }
                    })
                }}
            />
        </div>
    )
}
