'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackOrder } from '@/lib/api';

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setOrder(null);

        try {
            // Use Secure Endpoint
            const data = await trackOrder(parseInt(orderId), email);
            setOrder(data);
        } catch (err) {
            console.error(err);
            setError('No encontramos una orden con esos datos. Verifica el ID y el Email.');
        } finally {
            setLoading(false);
        }
    };

    const Steps = [
        { status: 'pending', label: 'Pendiente', icon: '📝' },
        { status: 'paid', label: 'Pagado', icon: '💰' },
        { status: 'shipped', label: 'En camino', icon: '🚚' },
        { status: 'ready_for_pickup', label: 'Listo p/Retirar', icon: '🛍️' },
        { status: 'completed', label: 'Entregado', icon: '✅' }
    ];

    const getCurrentStepIndex = (status: string) => {
        if (status === 'cancelled') return -1;
        const index = Steps.findIndex(s => s.status === status);
        // If status is "ready_for_pickup", it's parallel to "shipped" in UI flow? 
        // Let's simplify linear logic or handle mapped logical steps.
        // For MVP: if "ready_for_pickup", we can highlight that or "shipped" step.
        return index >= 0 ? index : 0;
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto animate-fadeIn text-white">
            <h1 className="text-3xl font-bold font-heading text-center mb-8">Seguimiento de Pedido</h1>

            <div className="bg-card p-8 rounded-xl border border-gray-800 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Número de Orden</label>
                        <input
                            type="number"
                            required
                            placeholder="Ej: 123"
                            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Email de Compra</label>
                        <input
                            type="email"
                            required
                            placeholder="tu@email.com"
                            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-primary focus:outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-black font-bold rounded hover:bg-yellow-500 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Consultando...' : 'Ver Estado'}
                    </button>
                    {error && <p className="text-red-500 text-center">{error}</p>}
                </form>
            </div>

            {order && (
                <div className="mt-8 bg-card p-8 rounded-xl border border-primary/20 animate-slideUp">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-primary">Orden #{order.id}</h2>
                        <p className="text-gray-400">Fecha: {new Date(order.created_at).toLocaleDateString()}</p>
                        {order.status === 'cancelled' ? (
                            <div className="mt-4 px-4 py-2 bg-red-500/20 text-red-500 rounded inline-block font-bold">
                                ❌ PEDIDO CANCELADO
                            </div>
                        ) : (
                            <div className="mt-8 relative">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -z-10 transform -translate-y-1/2"></div>
                                <div className="flex justify-between">
                                    {Steps.filter(s => s.status !== 'ready_for_pickup').map((step, idx) => {
                                        const currentIndex = getCurrentStepIndex(order.status);
                                        // Adjust index for display if needed (omitting pickup from timeline visual for logic simplicity)
                                        // Or just show simpler badge.

                                        // Let's us simpler Badge Logic instead of complex timeline if steps vary significantly.
                                        return null;
                                    })}
                                </div>
                                <div className="text-center">
                                    <span className="text-4xl block mb-2">
                                        {Steps.find(s => s.status === order.status)?.icon || '❓'}
                                    </span>
                                    <span className="text-xl font-bold text-white uppercase tracking-wider">
                                        {Steps.find(s => s.status === order.status)?.label || order.status}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 border-t border-gray-800 pt-6">
                        <h3 className="font-bold text-white">Detalle de Productos</h3>
                        {order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm text-gray-300">
                                <span>{item.quantity}x Producto {item.product_id}</span>
                                <span>${item.unit_price.toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="flex justify-between font-bold text-white pt-2 border-t border-gray-800">
                            <span>Total</span>
                            <span>${order.total_amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 text-center">
                <Link href="/" className="text-gray-500 hover:text-white transition-colors">
                    ← Volver a la tienda
                </Link>
            </div>
        </div>
    );
}
