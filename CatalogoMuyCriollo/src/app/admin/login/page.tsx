"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const LoginContent = dynamic(() => import('./LoginContent'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Cargando...</div>
})

export default function LoginPage() {
    return <LoginContent />
}
