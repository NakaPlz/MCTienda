export type Brand = {
    id: string
    name: string
}

export type Category = {
    id: string
    name: string
    slug: string
}

export interface ProductVariant {
    id: string
    product_id: string
    type: string
    value: string
    stock?: number
}

export interface ProductCombination {
    id: string
    product_id: string
    attributes: Record<string, string>
    stock: number
}

export interface Product {
    id: string
    created_at: string
    name: string
    description: string | null
    price: number
    active: boolean
    category_id: string | null
    brand_id: string | null
    stock: number
    priority: number
    is_new: boolean
    is_on_sale: boolean
    original_price: number | null
    // Relations
    categories?: Category
    brands?: Brand
    product_images?: ProductImage[]
    product_variants?: ProductVariant[]
    product_combinations?: ProductCombination[]
}

export type ProductImage = {
    id: string
    product_id: string
    url: string
    display_order: number
}

