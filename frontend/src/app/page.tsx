'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchProducts } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Sidebar from '@/components/Sidebar';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  image_url?: string;
  description?: string;
  external_id?: string;
  category?: string;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem, items } = useCart();

  // Read state from URL or Default
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const categories = searchParams.getAll('category'); // Array of strings
  const minPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined;
  const maxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Local input state for search (to allow typing without constant URL updates)
  const [localSearch, setLocalSearch] = useState(search);

  // Sync local search input with URL when URL changes (e.g. back button)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const LIMIT = 15;

  // Sync state TO URL
  const updateUrl = (newPage: number, newSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newPage > 1) params.set('page', newPage.toString());
    else params.delete('page');

    if (newSearch) params.set('search', newSearch);
    else params.delete('search');

    router.push(`/?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchProducts(page, LIMIT, categories, search, minPrice, maxPrice);

        if (data.items) {
          setProducts(data.items);
          setTotalPages(Math.ceil(data.total / LIMIT));
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (e) {
        console.error("Error loading products", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, JSON.stringify(categories), search, minPrice, maxPrice]);

  // Debounced URL update for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearch !== search) {
        updateUrl(1, localSearch);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [localSearch]);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <main className="container mx-auto max-w-[95%] px-4 sm:px-6 lg:px-8 py-12">

        {/* Mobile Search Bar (Top) */}
        <div className="md:hidden w-full mb-6">
          <input
            type="text"
            placeholder="Buscar producto..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white focus:border-primary focus:outline-none"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Column (Desktop: 20%, Mobile: 100%) - Sticky */}
          <aside className="w-full md:w-1/5 flex-shrink-0 sticky top-24 h-fit z-10">
            <Sidebar />
          </aside>

          {/* Main Content Column (Desktop: 80%) */}
          <section className="flex-1">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <h2 className="text-3xl font-bold font-heading text-white text-center md:text-left">
                {categories.length > 0 ? categories.join(', ') : 'Todos los Productos'}
                <div className="h-1 w-20 bg-primary/30 rounded-full mt-2 mx-auto md:mx-0"></div>
              </h2>

              {/* Desktop Search Bar */}
              <div className="hidden md:block w-64">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-500 animate-pulse">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Cargando lo mejor del campo...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {products.length > 0 ? products.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}?${searchParams.toString()}`} className="block group">
                      <ProductCard
                        product={product}
                      />
                    </Link>
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                      <span className="text-4xl mb-4">🔍</span>
                      <p className="text-lg">No se encontraron productos.</p>
                      <p className="text-sm text-gray-600 mt-2">Prueba con otros filtros o términos de búsqueda.</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center gap-4 items-center">
                    <button
                      disabled={page === 1}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('page', (page - 1).toString());
                        router.push(`/?${params.toString()}`, { scroll: false });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 bg-gray-800 text-white rounded-full hover:bg-primary hover:text-black hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-gray-800 disabled:hover:text-white disabled:cursor-not-allowed transition-all duration-300"
                      aria-label="Página anterior"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>

                    <span className="text-gray-400 font-mono text-sm uppercase">
                      <span className="text-white font-bold">{page}</span> / {totalPages}
                    </span>

                    <button
                      disabled={page === totalPages}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('page', (page + 1).toString());
                        router.push(`/?${params.toString()}`, { scroll: false });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 bg-gray-800 text-white rounded-full hover:bg-primary hover:text-black hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-gray-800 disabled:hover:text-white disabled:cursor-not-allowed transition-all duration-300"
                      aria-label="Página siguiente"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-20 py-12 border-t border-border bg-black/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-xl font-heading text-primary mb-4">Muy Criollo</h3>
          <p className="text-gray-500 mb-2">Florida 537, Galería Jardín, Local 433, CABA</p>
          <p className="text-gray-600 text-sm">© 2026 Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-white p-20 text-center">Cargando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
