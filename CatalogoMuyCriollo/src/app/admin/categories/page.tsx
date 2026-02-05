"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const CategoriesContent = dynamic(() => import('./CategoriesContent'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Cargando...</div>
})

export default function CategoriesPage() {
    return <CategoriesContent />
}
