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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, items } = useCart();

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProducts();
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          // Mock data if backend empty/offline
          setProducts([
            { id: '1', sku: 'MC-001', name: 'Sombrero Pampa Fieltro', price: 279999, stock: 5, image_url: 'https://http2.mlstatic.com/D_784440-MLA88199385639_072025-O.jpg' },
            { id: '2', sku: 'MC-002', name: 'Boina Vento Lagomarsino', price: 79999, stock: 12, image_url: 'https://http2.mlstatic.com/D_722878-MLA73802540927_012024-O.jpg' },
            { id: '3', sku: 'MC-003', name: 'Cuchillo Artesanal Mission', price: 45000, stock: 3, image_url: 'https://http2.mlstatic.com/D_888000-MLA69389322337_052023-O.jpg' },
          ]);
        }
      } catch (e) {
        console.error("Error loading products", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url
    });
    // Optional: Toast notification here instead of alert
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Logo Placeholder - Text based for now */}
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
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold font-heading text-white">Nuestros Productos</h2>
            <div className="h-1 w-20 bg-primary/30 rounded-full"></div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500 animate-pulse">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Cargando lo mejor del campo...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} className="block group">
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-20 py-12 border-t border-border bg-black/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-xl font-heading text-primary mb-4">Muy Criollo</h3>
          <p className="text-gray-500 mb-2">Florida 537, Galería Jardín, Local 433, CABA</p>
          <p className="text-gray-600 text-sm">© 2026 Todos los derechos reservados.</p>
          <p className="text-xs text-gray-800 mt-2">v.Deploy-{new Date().toISOString()}</p>
        </div>
      </footer>
    </div>
  );
}
