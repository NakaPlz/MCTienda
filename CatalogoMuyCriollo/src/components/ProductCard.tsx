import Link from 'next/link'
import { Product } from '@/types/database'
import { ImageWithFallback } from './ImageWithFallback'

interface ProductCardProps {
    product: Product
}

export function ProductCard({ product }: ProductCardProps) {
    const mainImage = product.product_images?.[0]?.url

    return (
        <Link href={`/product?id=${product.id}`} className="group block">
            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/50">
                {/* Image Container with Badges */}
                <div className="relative aspect-square overflow-hidden bg-muted">
                    <ImageWithFallback
                        src={mainImage}
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {product.is_new && (
                            <span className="bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded">
                                Nuevo
                            </span>
                        )}
                        {product.is_on_sale && (
                            <span className="bg-red-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded">
                                Oferta
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Category */}
                    <div className="mb-1 text-xs text-primary uppercase tracking-wider font-medium">
                        {product.categories?.name || 'Varios'}
                    </div>

                    {/* Name */}
                    <h3 className="font-medium text-base leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                        {product.is_on_sale && product.original_price && (
                            <span className="text-sm text-muted-foreground line-through">
                                ${product.original_price.toLocaleString('es-AR')}
                            </span>
                        )}
                        <span className="font-bold text-lg">
                            ${product.price.toLocaleString('es-AR')}
                        </span>
                    </div>

                    {/* Brand */}
                    {product.brands?.name && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            {product.brands.name}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}
