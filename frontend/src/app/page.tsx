'use client';

import { useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  image_url?: string;
  description?: string;
  external_id?: string;
}

// ... imports existing ...

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState(''); // Future sidebar
  const [search, setSearch] = useState('');

  const { addItem, items } = useCart();
  const LIMIT = 9;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchProducts(page, LIMIT, category, search);
        // Backend returns: { items: [], total: 0, page: 1, limit: N }

        if (data.items) {
          setProducts(data.items);
          setTotalPages(Math.ceil(data.total / LIMIT));
        } else if (Array.isArray(data)) {
          // Fallback for old API if cached (should not happen but safe)
          setProducts(data);
        } else {
          // Mock if backend offline locally
          setProducts([]);
        }
      } catch (e) {
        console.error("Error loading products", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, category, search]);

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url
    });
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          {/* ... Existing header (Logo + Cart) ... */}
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary font-heading tracking-tight">Muy Criollo</h1>
              <p className="text-xs text-gray-400 tracking-widest uppercase">Tienda de Campo</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/orders/track" className="text-sm font-bold text-gray-300 hover:text-primary transition-colors uppercase tracking-wider hidden sm:block">
              Seguí tu pedido
            </Link>
            <Link href="/cart" className="group relative flex items-center p-2 rounded-full hover:bg-white/5 transition-colors">
              <div className="relative">
                <span className="text-2xl group-hover:scale-110 transition-transform block">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-black text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full animate-in fade-in zoom-in duration-200">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section>
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
            <h2 className="text-3xl font-bold font-heading text-white text-center md:text-left">
              Nuestros Productos
              <div className="h-1 w-20 bg-primary/30 rounded-full mt-2 mx-auto md:mx-0"></div>
            </h2>

            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar producto..."
                className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 px-4 text-white focus:border-primary focus:outline-none"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} // Reset page on search
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                {products.length > 0 ? products.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`} className="block group">
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  </Link>
                )) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No se encontraron productos.
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="flex items-center text-gray-400 font-mono">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
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
