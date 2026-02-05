"use client"

import { useState } from 'react'
import { Share2, Link as LinkIcon, Phone } from 'lucide-react'

interface ShareButtonsProps {
    productName: string
    productDescription?: string | null
}

export function ShareButtons({ productName, productDescription }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false)

    const handleCopyLink = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleWhatsAppShare = () => {
        const url = window.location.href
        const text = `¡Mirá este producto increíble! ${productName} - ${url}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    return (
        <div className="flex gap-2 mt-4">
            <button
                onClick={handleWhatsAppShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
                <Phone className="h-4 w-4" />
                Compartir
            </button>
            <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm font-medium"
            >
                {copied ? (
                    <>
                        <span className="text-green-600">¡Copiado!</span>
                    </>
                ) : (
                    <>
                        <LinkIcon className="h-4 w-4" />
                        Copiar Link
                    </>
                )}
            </button>
        </div>
    )
}
