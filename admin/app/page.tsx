import { Package, DollarSign, AlertCircle } from "lucide-react";
import Link from 'next/link';
import { API_URL } from '@/lib/api';

async function getStats() {
  try {
    const res = await fetch(`${API_URL}/admin/stats`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-8 text-foreground">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Products */}
        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-lg border border-border flex items-center gap-4">
          <div className="p-3 bg-blue-900/30 text-blue-400 rounded-full border border-blue-800">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Productos Activos</p>
            <h3 className="text-2xl font-bold">{stats?.active_products ?? '--'}</h3>
          </div>
        </div>

        {/* Card 2: Stock Alert */}
        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-lg border border-border flex items-center gap-4">
          <div className="p-3 bg-yellow-900/30 text-yellow-400 rounded-full border border-yellow-800">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Bajo Stock</p>
            <h3 className="text-2xl font-bold">{stats?.low_stock ?? '--'}</h3>
          </div>
        </div>

        {/* Card 3: Actions */}
        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-lg border border-border flex items-center gap-4">
          <div className="p-3 bg-green-900/30 text-green-400 rounded-full border border-green-800">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Ventas Hoy</p>
            <h3 className="text-2xl font-bold">
              {stats?.sales_today !== undefined
                ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(stats.sales_today)
                : '$0'}
            </h3>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4 text-foreground">Acciones Rápidas</h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-yellow-600 transition font-medium">
            Sincronizar Stock
          </button>
          <Link href="/products" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-stone-700 transition font-medium border border-border">
            Ver Productos
          </Link>
        </div>
      </div>
    </div>
  );
}