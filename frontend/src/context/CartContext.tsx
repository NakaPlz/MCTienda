'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    product_id: string; // internal UUID
    variant_id?: number; // New: Variant ID in DB
    sku: string;
    name: string;
    price: number;
    quantity: number;
    stock: number; // Added stock field
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
                const totalQuantity = existingItem.quantity + newItem.quantity;

                if (totalQuantity > newItem.stock) {
                    alert(`No puedes agregar más de ${newItem.stock} unidades de este producto.`);
                    return currentItems.map(item =>
                        (item.product_id === newItem.product_id && item.variant_id === newItem.variant_id)
                            ? { ...item, quantity: newItem.stock } // Cap at max stock
                            : item
                    );
                }

                return currentItems.map(item =>
                    (item.product_id === newItem.product_id && item.variant_id === newItem.variant_id)
                        ? { ...item, quantity: totalQuantity }
                        : item
                );
            }

            // New item check
            if (newItem.quantity > newItem.stock) {
                alert(`Solo hay ${newItem.stock} unidades disponibles.`);
                return [...currentItems, { ...newItem, quantity: newItem.stock }];
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
            currentItems.map(item => {
                if (item.product_id === productId && item.variant_id === variantId) {
                    if (quantity > item.stock) {
                        alert(`Solo hay ${item.stock} unidades disponibles.`);
                        return { ...item, quantity: item.stock };
                    }
                    return { ...item, quantity };
                }
                return item;
            })
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
