"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const ProductsContent = dynamic(() => import('./ProductsContent'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Cargando...</div>
})

export default function ProductsPage() {
    return <ProductsContent />
}
