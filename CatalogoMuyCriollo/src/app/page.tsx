"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const HomeContent = dynamic(() => import('./HomeContent'), {
  ssr: false,
  loading: () => (
    <div className="container py-10 text-center">
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-muted rounded"></div>
        <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
      </div>
    </div>
  )
})

export default function Home() {
  return <HomeContent />
}
