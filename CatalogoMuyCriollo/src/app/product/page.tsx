"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const ProductDetailContent = dynamic(() => import('./ProductDetailContent'), {
    ssr: false,
    loading: () => <div className="container py-20 text-center">Cargando...</div>
})

export default function ProductPage() {
    return <ProductDetailContent />
}
