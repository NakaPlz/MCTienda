"use client"

import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string
}

export function ImageWithFallback({ fallbackSrc = '/placeholder.png', src, alt, className, ...props }: ImageWithFallbackProps) {
    const [error, setError] = useState(false)

    if (error || !src) {
        return (
            <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}>
                <div className="flex flex-col items-center gap-2 text-xs p-2 text-center">
                    <ImageOff className="h-6 w-6 opacity-50" />
                    <span>Sin imagen</span>
                </div>
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setError(true)}
            {...props}
        />
    )
}
