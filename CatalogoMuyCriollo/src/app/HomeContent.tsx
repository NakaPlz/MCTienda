"use client"

import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/ProductCard'
import { HeroSection } from '@/components/HeroSection'
import { Pagination } from '@/components/Pagination'
import { Product } from '@/types/database'
import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, ChevronDown } from 'lucide-react'

const PRODUCTS_PER_PAGE = 9

// Map URL slugs to category names (these should match your DB categories)
const CATEGORY_SLUG_MAP: Record<string, string> = {
    'sombreros': 'Sombreros',
    'cuchilleria': 'Cuchillería',
    'talabarteria': 'Talabartería',
}

export default function HomeContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    // Get URL params
    const urlCategory = searchParams.get('category')
    const urlPage = parseInt(searchParams.get('page') || '1', 10)

    // Filter States
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('newest')
    const [currentPage, setCurrentPage] = useState(urlPage)

    // Sync URL category with selected category
    useEffect(() => {
        if (urlCategory && CATEGORY_SLUG_MAP[urlCategory]) {
            // Find category ID by name
            const categoryName = CATEGORY_SLUG_MAP[urlCategory]
            const cat = products.find(p => p.categories?.name === categoryName)?.categories
            if (cat) {
                setSelectedCategory(cat.id)
            }
        } else {
            setSelectedCategory('all')
        }
    }, [urlCategory, products])

    // Sync URL page with current page
    useEffect(() => {
        setCurrentPage(urlPage)
    }, [urlPage])

    // Derived Options
    const categories = useMemo(() => {
        const cats = new Map<string, string>()
        products.forEach(p => {
            if (p.categories) cats.set(p.categories.id, p.categories.name)
        })
        return Array.from(cats.entries())
    }, [products])

    useEffect(() => {
        async function fetchProducts() {
            const { data, error } = await supabase
                .from('products')
                .select(`
          *,
          categories (id, name, slug),
          brands (id, name),
          product_images (url, display_order)
        `)
                .eq('active', true)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching products:', error)
            } else if (data) {
                setProducts(data as any)
            }
            setLoading(false)
        }

        fetchProducts()
    }, [])

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || product.categories?.id === selectedCategory

        return matchesSearch && matchesCategory
    }).sort((a, b) => {
        switch (sortBy) {
            case 'price_asc':
                return a.price - b.price
            case 'price_desc':
                return b.price - a.price
            case 'name_asc':
                return a.name.localeCompare(b.name)
            case 'newest':
            default:
                const priorityA = a.priority || 0
                const priorityB = b.priority || 0
                if (priorityA !== priorityB) {
                    return priorityB - priorityA
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
    })

    // Pagination calculations
    const totalProducts = filteredProducts.length
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE)
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        // Build new URL preserving other params
        const params = new URLSearchParams(searchParams.toString())
        if (page > 1) {
            params.set('page', page.toString())
        } else {
            params.delete('page')
        }
        const newUrl = params.toString() ? `/?${params.toString()}` : '/'
        router.push(newUrl, { scroll: true })
    }

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId)
        setCurrentPage(1)

        // Build new URL with category slug for navbar links
        const params = new URLSearchParams()
        if (categoryId !== 'all') {
            const categoryName = categories.find(([id]) => id === categoryId)?.[1]
            if (categoryName) {
                const slug = Object.entries(CATEGORY_SLUG_MAP).find(([, name]) => name === categoryName)?.[0]
                if (slug) {
                    params.set('category', slug)
                }
            }
        }
        const newUrl = params.toString() ? `/?${params.toString()}` : '/'
        router.push(newUrl, { scroll: false })
    }

    if (loading) {
        return (
            <>
                <HeroSection />
                <div className="container py-10 text-center">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
                        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-square bg-muted rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <HeroSection />
            <section className="container py-10">
                <div className="mb-10 text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Nuestros Productos</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Explora nuestra selección exclusiva de productos regionales, elaborados con pasión y tradición.
                    </p>
                </div>

                {/* Filters Section */}
                <div className="mb-8 p-4 bg-card text-card-foreground rounded-lg border shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                className="w-full pl-9 pr-4 py-2 rounded-md border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Category Filter - Dropdown */}
                        <div className="relative">
                            <select
                                className="appearance-none px-4 py-2 pr-10 rounded-md border bg-background text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                            >
                                <option value="all">Todas las Categorías</option>
                                {categories.map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Sort By */}
                        <div className="relative">
                            <select
                                className="appearance-none px-4 py-2 pr-10 rounded-md border bg-background text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Más Recientes</option>
                                <option value="price_asc">Menor Precio</option>
                                <option value="price_desc">Mayor Precio</option>
                                <option value="name_asc">Nombre (A-Z)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-6 text-sm text-muted-foreground">
                    Mostrando {paginatedProducts.length} de {totalProducts} productos
                    {selectedCategory !== 'all' && (
                        <button
                            onClick={() => handleCategoryChange('all')}
                            className="ml-2 text-primary hover:underline"
                        >
                            (Ver todos)
                        </button>
                    )}
                </div>

                {/* Products Grid */}
                {paginatedProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {paginatedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <p className="text-lg">No se encontraron productos con los filtros seleccionados.</p>
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                handleCategoryChange('all')
                            }}
                            className="mt-4 text-primary hover:underline"
                        >
                            Ver todos los productos
                        </button>
                    </div>
                )}
            </section>
        </>
    )
}
