"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const DashboardContent = dynamic(() => import('./DashboardContent'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Cargando...</div>
})

export default function DashboardPage() {
    return <DashboardContent />
}
