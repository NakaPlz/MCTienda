"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const NavbarContent = dynamic(() => import('./NavbarContent'), {
    ssr: false,
    loading: () => (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <span className="font-bold text-xl"><span className="text-primary">MUY</span><span>CRIOLLO</span></span>
            </div>
        </header>
    )
})

export function Navbar() {
    return <NavbarContent />
}
