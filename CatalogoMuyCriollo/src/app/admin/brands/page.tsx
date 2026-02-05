"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const BrandsContent = dynamic(() => import('./BrandsContent'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Cargando...</div>
})

export default function BrandsPage() {
    return <BrandsContent />
}
