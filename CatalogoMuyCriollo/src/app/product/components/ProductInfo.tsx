"use client"

import { Product, ProductVariant } from '@/types/database'
import { useCart } from '@/context/CartContext'
import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { ShareButtons } from './ShareButtons'

interface ProductInfoProps {
    product: Product
}

export function ProductInfo({ product }: ProductInfoProps) {
    const { addItem } = useCart()
    const variants = product.product_variants || []

    // Group variants by type
    const variantsByType = variants.reduce((acc, v) => {
        if (!acc[v.type]) acc[v.type] = []
        acc[v.type].push(v)
        return acc
    }, {} as Record<string, ProductVariant[]>)

    const variantTypes = Object.keys(variantsByType)

    // Selection State: { "Color": "id1", "Talle": "id2" }
    const [selections, setSelections] = useState<Record<string, string>>({})
    const [isAdded, setIsAdded] = useState(false)

    const toggleSelection = (type: string, id: string) => {
        setSelections(prev => ({
            ...prev,
            [type]: prev[type] === id ? '' : id
        }))
    }

    const handleAddToCart = () => {
        // Collect selected variants objects
        const selectedVariants = variantTypes
            .map(type => {
                const id = selections[type]
                return variantsByType[type].find(v => v.id === id)
            })
            .filter((v): v is ProductVariant => !!v)

        addItem(product, selectedVariants)
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 2000)
    }

    // Check Availability Helper
    const isVariantAvailable = (type: string, variant: ProductVariant) => {
        // 1. If no combinations, assume available (or fallback to simple stock logic if needed)
        // Check simple stock if no variants at all, but here we are checking a variant option.
        if (!product.product_combinations || product.product_combinations.length === 0) return true;

        // 2. Formulate hypothetical selection state
        // We want to check: If I select THIS variant (overwriting any existing selection for this type),
        // combined with my CURRENT selections for OTHER types, is there a valid combination with stock?
        const candidateSelections = { ...selections, [type]: variant.id }

        // 3. Convert IDs to Values for comparison with Matrix
        const requiredAttributes: Record<string, string> = {}
        let valid = true
        Object.entries(candidateSelections).forEach(([t, id]) => {
            if (!id) return // skip empty selections
            const v = variants.find(v => v.id === id)
            if (v) {
                requiredAttributes[t] = v.value
            } else {
                valid = false
            }
        })
        if (!valid) return false

        // 4. Check against combinations
        return product.product_combinations.some(combo => {
            // Does this combo match ALL required attributes?
            for (const [reqKey, reqVal] of Object.entries(requiredAttributes)) {
                // The combo must have this attribute and equal value
                // Note: product_combinations attributes keys are typically capitalized "Color", "Talle" based on input
                // We need to ensure case matching or standardizing. The input form used exact strings.
                // variant.type maps to attribute value.
                if (combo.attributes[reqKey] !== reqVal) return false
            }
            return combo.stock > 0
        })
    }

    return (
        <div className="flex flex-col h-full">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    {product.categories?.name && (
                        <span className="text-sm text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">
                            {product.categories.name}
                        </span>
                    )}
                    {product.brands?.name && (
                        <span className="text-sm text-muted-foreground">
                            {product.brands.name}
                        </span>
                    )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                    {product.name}
                </h1>

                <div className="text-2xl font-bold mb-6">
                    ${product.price.toLocaleString('es-AR')}
                </div>

                <div className="prose prose-sm text-muted-foreground mb-8">
                    <p>{product.description}</p>
                </div>

                {/* Variants Selection */}
                {variantTypes.length > 0 && (
                    <div className="space-y-6 mb-8">
                        {variantTypes.map(type => (
                            <div key={type}>
                                <h3 className="text-sm font-medium mb-3">{type}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {variantsByType[type].map((variant) => {
                                        const available = isVariantAvailable(type, variant)
                                        const selected = selections[type] === variant.id
                                        return (
                                            <button
                                                key={variant.id}
                                                onClick={() => available && toggleSelection(type, variant.id)}
                                                disabled={!available}
                                                title={!available ? "Sin stock para esta combinación" : ""}
                                                className={`px-4 py-2 rounded-md border text-sm transition-all relative ${selected
                                                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary font-medium'
                                                    : available
                                                        ? 'hover:border-primary/50 hover:bg-muted/50'
                                                        : 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground line-through decoration-destructive/50'
                                                    }`}
                                            >
                                                {variant.value}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stock Display Logic */}
                {(() => {
                    // Check if current selection is complete
                    const allSelected = variantTypes.every(t => selections[t])
                    if (allSelected && product.product_combinations && product.product_combinations.length > 0) {
                        const selectedCombo = product.product_combinations.find(c => {
                            return Object.entries(c.attributes).every(([key, val]) => {
                                const selectedId = selections[key]
                                const selectedVariant = variants.find(v => v.id === selectedId)
                                return selectedVariant && selectedVariant.value === val
                            })
                        })

                        if (selectedCombo) {
                            return (
                                <div className={`mb-6 p-3 rounded-md text-sm font-medium border ${selectedCombo.stock > 0 ? 'bg-green-900/10 border-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-900/10 border-red-900/20 text-red-700 dark:text-red-400'}`}>
                                    {selectedCombo.stock > 0
                                        ? `Stock disponible: ${selectedCombo.stock} unidades`
                                        : "Sin stock disponible para esta combinación"}
                                </div>
                            )
                        }
                    }
                    return null
                })()}

            </div>

            <div className="mt-auto pt-6 border-t">
                <button
                    onClick={handleAddToCart}
                    disabled={isAdded}
                    className={`w-full btn btn-primary py-4 text-lg gap-2 ${isAdded ? 'bg-green-600 hover:bg-green-700' : ''
                        }`}
                >
                    {isAdded ? (
                        <>
                            <Check className="h-5 w-5" />
                            Agregado a Consultas
                        </>
                    ) : (
                        <>
                            <ShoppingBag className="h-5 w-5" />
                            Agregar a Consultas
                        </>
                    )}
                </button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                    Agregar este producto a tu lista de consulta no implica compromiso de compra.
                </p>

                <ShareButtons productName={product.name} />
            </div>
        </div>
    )
}
