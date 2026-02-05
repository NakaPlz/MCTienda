"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const StockContent = dynamic(() => import('./StockContent'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Cargando...</div>
})

export default function StockDashboardPage() {
    return <StockContent />
}
