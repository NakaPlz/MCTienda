"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product, ProductVariant } from '@/types/database'

export type CartItem = {
    product: Product
    variants: ProductVariant[]
    quantity: number
}

interface CartContextType {
    items: CartItem[]
    addItem: (product: Product, variants?: ProductVariant[]) => void
    updateQuantity: (productId: string, variantKey: string, delta: number) => void
    removeItem: (productId: string, variantIdsKey?: string) => void
    clearCart: () => void
    totalItems: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isInitialized, setIsInitialized] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('muy_criollo_cart')
        if (savedCart) {
            try {
                // Migration: If old cart has 'variant' (singular), wrap it in array
                const parsed = JSON.parse(savedCart)
                const migrated = parsed.map((item: any) => ({
                    ...item,
                    variants: item.variants ? item.variants : (item.variant ? [item.variant] : [])
                }))
                setItems(migrated)
            } catch (e) {
                console.error('Failed to parse cart', e)
            }
        }
        setIsInitialized(true)
    }, [])

    // Save to localStorage on change
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('muy_criollo_cart', JSON.stringify(items))
        }
    }, [items, isInitialized])

    const getVariantKey = (variants: ProductVariant[]) => {
        return variants.map(v => v.id).sort().join('-')
    }

    const addItem = (product: Product, variants: ProductVariant[] = []) => {
        setItems((prev) => {
            const newVariantKey = getVariantKey(variants)

            const existingIndex = prev.findIndex(
                (item) =>
                    item.product.id === product.id &&
                    getVariantKey(item.variants) === newVariantKey
            )

            if (existingIndex >= 0) {
                const newItems = [...prev]
                newItems[existingIndex].quantity += 1
                return newItems
            } else {
                return [...prev, { product, variants, quantity: 1 }]
            }
        })
    }

    const updateQuantity = (productId: string, variantKey: string, delta: number) => {
        setItems(prev => prev.map(item => {
            if (item.product.id === productId && getVariantKey(item.variants) === variantKey) {
                const newQty = item.quantity + delta
                return newQty > 0 ? { ...item, quantity: newQty } : item
            }
            return item
        }))
    }

    const removeItem = (productId: string, variantIdsKey?: string) => {
        setItems((prev) =>
            prev.filter((item) =>
                !(item.product.id === productId && getVariantKey(item.variants) === (variantIdsKey || ''))
            )
        )
    }

    const clearCart = () => setItems([])

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, totalItems }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
