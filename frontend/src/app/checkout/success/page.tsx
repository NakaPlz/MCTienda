'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrder, confirmPayment } from '@/lib/api';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

function SuccessContent() {
    const searchParams = useSearchParams();
    const external_reference = searchParams.get('external_reference'); // Our Order ID
    const payment_id = searchParams.get('payment_id') || searchParams.get('collection_id'); // MP Payment ID

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { clearCart } = useCart();

    useEffect(() => {
        const processOrder = async () => {
            if (!external_reference) {
                setLoading(false);
                return;
            }

            try {
                const orderId = parseInt(external_reference);

                // Confirm payment if ID is present
                if (payment_id) {
                    await confirmPayment(orderId, payment_id);
                }

                // Fetch refined order logic
                const orderData = await getOrder(orderId);
                setOrder(orderData);

                // Clear cart once order is confirmed/retrieved
                if (orderData) {
                    clearCart();
                }
            } catch (err) {
                console.error("Error processing order:", err);
            } finally {
                setLoading(false);
            }
        };

        processOrder();
    }, [external_reference, payment_id, clearCart]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <p className="animate-pulse text-xl">Confirmando tu compra...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-white">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
                <p className="text-gray-300">No pudimos encontrar los detalles de tu orden o la referencia es inválida.</p>
                <Link href="/" className="mt-8 px-6 py-3 border border-gray-600 rounded hover:bg-gray-800">
                    Volver al Inicio
                </Link>
            </div>
        );
    }

    // Parse JSON fields if they are strings
    let shippingData: any = {};
    let billingData: any = {};
    try {
        shippingData = typeof order.shipping_data === 'string' ? JSON.parse(order.shipping_data) : order.shipping_data;
        billingData = typeof order.billing_data === 'string' ? JSON.parse(order.billing_data) : order.billing_data;
    } catch (e) {
        console.error("Error parsing JSON data", e);
    }

    return (
        <div className="min-h-screen p-8 max-w-4xl mx-auto text-white animate-fadeIn">
            <div className="bg-card p-8 rounded-2xl border border-primary/30 shadow-2xl shadow-primary/10 text-center mb-8">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                    ✓
                </div>
                <h1 className="text-4xl font-bold font-heading text-primary mb-2">¡Gracias por tu Compra!</h1>
                <p className="text-gray-400 text-lg">Tu pedido ha sido registrado exitosamente.</p>
                <div className="mt-6 inline-block bg-gray-800/50 px-6 py-2 rounded-lg border border-gray-700">
                    <span className="text-gray-400 mr-2">Nro de Orden:</span>
                    <span className="text-2xl font-mono font-bold text-white">#{order.id}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Detalles del Pedido */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-primary border-b border-border pb-2">📦 Productos</h2>
                    <ul className="space-y-4">
                        {order.items.map((item: any) => (
                            <li key={item.id} className="bg-card p-4 rounded-lg flex justify-between items-center border border-border">
                                <div>
                                    <p className="font-bold text-white uppercase">{/* Product Name missing in OrderItem schema, fetching from DB needed or assuming product loaded relation */}
                                        Producto # {item.product_id}
                                    </p>
                                    <p className="text-sm text-gray-400">Cant: {item.quantity}</p>
                                </div>
                                <p className="font-mono text-primary font-bold">${(item.unit_price * item.quantity).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-border">
                        <span>Total Pagado</span>
                        <span className="text-green-400">${order.total_amount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Envío y Facturación */}
                <div className="space-y-8">
                    {/* Sección Envío */}
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            🚚 {order.delivery_method === 'pickup' ? 'Retiro en Local' : 'Envio a Domicilio'}
                        </h3>
                        {order.delivery_method === 'pickup' ? (
                            <div className="text-gray-300 space-y-2 text-sm">
                                <p><strong className="text-white">Retira:</strong> {shippingData.pickup_name}</p>
                                <p><strong className="text-white">DNI:</strong> {shippingData.pickup_dni}</p>
                                <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded text-primary text-xs">
                                    📍 <strong>Dirección de Retiro:</strong><br />
                                    Florida 537, Galería Jardín, Local 433<br />
                                    Lun a Vie 9-18hs
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-300 space-y-1 text-sm">
                                <p>{shippingData.address}</p>
                                <p>{shippingData.floor_apt}</p>
                                <p>{shippingData.city}, {shippingData.province}</p>
                                <p>CP: {shippingData.zip_code}</p>
                            </div>
                        )}
                    </div>

                    {/* Sección Facturación */}
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <h3 className="text-xl font-bold text-white mb-4">🧾 Factura {billingData.invoice_type}</h3>
                        <div className="text-gray-300 space-y-1 text-sm">
                            <p><strong className="text-white">Razón Social/Nombre:</strong> {billingData.name || "N/A"}</p>
                            {billingData.invoice_type === 'A' ? (
                                <>
                                    <p><strong className="text-white">CUIT:</strong> {billingData.cuit}</p>
                                    <p><strong className="text-white">Dirección:</strong> {billingData.fiscal_address}</p>
                                </>
                            ) : (
                                <p><strong className="text-white">DNI:</strong> {billingData.dni}</p>
                            )}
                            <p><strong className="text-white">Email:</strong> {billingData.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <Link href="/" className="px-8 py-4 bg-primary text-black font-bold rounded-full hover:bg-yellow-500 transition-all shadow-lg shadow-primary/20">
                    Volver a comprar
                </Link>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="text-white p-8 text-center">Cargando...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
