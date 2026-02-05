'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    product_id: string; // internal UUID
    variant_id?: number; // New: Variant ID in DB
    sku: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    size?: string | null;
    color?: string | null;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (productId: string, variantId?: number) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: number) => void;
    clearCart: () => void;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        // Load cart from localStorage on mount
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to load cart", e);
            }
        }
    }, []);

    useEffect(() => {
        // Save cart to localStorage whenever items change
        localStorage.setItem('cart', JSON.stringify(items));

        // Calculate total
        const newTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTotal(newTotal);
    }, [items]);

    const addItem = (newItem: CartItem) => {
        setItems(currentItems => {
            // Check if item exists (same product AND same variant)
            const existingItem = currentItems.find(item =>
                item.product_id === newItem.product_id && item.variant_id === newItem.variant_id
            );

            if (existingItem) {
                return currentItems.map(item =>
                    (item.product_id === newItem.product_id && item.variant_id === newItem.variant_id)
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                );
            }
            return [...currentItems, newItem];
        });
    };

    const removeItem = (productId: string, variantId?: number) => {
        setItems(currentItems => currentItems.filter(item =>
            !(item.product_id === productId && item.variant_id === variantId)
        ));
    };

    const updateQuantity = (productId: string, quantity: number, variantId?: number) => {
        if (quantity < 1) return;
        setItems(currentItems =>
            currentItems.map(item =>
                (item.product_id === productId && item.variant_id === variantId)
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
