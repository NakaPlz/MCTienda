"use client"

import { ProductImage } from '@/types/database'
import { useState } from 'react'

interface ProductGalleryProps {
    images: ProductImage[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(images[0]?.url || '/placeholder.png')

    if (images.length === 0) {
        return (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                No Images
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="aspect-square bg-card rounded-lg border overflow-hidden">
                <img
                    src={selectedImage}
                    alt="Product details"
                    className="w-full h-full object-contain"
                />
            </div>
            {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {images.map((img) => (
                        <button
                            key={img.id}
                            onClick={() => setSelectedImage(img.url)}
                            className={`relative h-20 w-20 flex-shrink-0 rounded-md border-2 overflow-hidden ${selectedImage === img.url ? 'border-primary' : 'border-transparent'
                                }`}
                        >
                            <img
                                src={img.url}
                                alt="Product thumbnail"
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
