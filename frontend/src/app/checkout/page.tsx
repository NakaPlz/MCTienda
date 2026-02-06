'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { createOrder, calculateShipping } from '@/lib/api';
import Link from 'next/link';

export default function CheckoutPage() {
    const { items, total } = useCart();

    // --- STATE MANAGEMENT ---

    // 1. Buyer Data
    const [buyer, setBuyer] = useState({ first_name: '', last_name: '', email: '', phone: '' });

    // 2. Shipping/Pickup
    const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
    const [shippingAddress, setShippingAddress] = useState({
        address: '', floor_apt: '', province: '', city: '', zip_code: ''
    });
    const [pickupData, setPickupData] = useState({ pickup_name: '', pickup_dni: '' });

    // 3. Billing
    const [invoiceType, setInvoiceType] = useState<'B' | 'A'>('B');
    const [billingData, setBillingData] = useState({
        name: '', dni: '', cuit: '', fiscal_address: '', email: ''
    });

    const [loading, setLoading] = useState(false);
    const [shippingCost, setShippingCost] = useState(0);
    const [shippingMessage, setShippingMessage] = useState('');
    const [error, setError] = useState('');

    // --- EFFECTS ---

    // Calculate shipping whenever method or items change
    useEffect(() => {
        const fetchShipping = async () => {
            if (items.length === 0) return;

            const payload = {
                items: items.map(item => ({ product_id: item.product_id, quantity: item.quantity, unit_price: item.price })),
                delivery_method: deliveryMethod
            };

            const result = await calculateShipping(payload);
            setShippingCost(result.cost);
            setShippingMessage(result.message);
        };
        fetchShipping();
    }, [items, deliveryMethod]);

    // Copy Buyer info to Pickup/Billing Helper (optional buttons logic)
    const copyBuyerToPickup = () => {
        setPickupData(prev => ({ ...prev, pickup_name: `${buyer.first_name} ${buyer.last_name}` }));
    };
    const copyBuyerToBilling = () => {
        let addressToCopy = '';
        if (deliveryMethod === 'shipping') {
            addressToCopy = `${shippingAddress.address}, ${shippingAddress.floor_apt}, ${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.zip_code}`
                .replace(/, ,/g, ',') // Clean up empty segments
                .replace(/ ,/g, ',')
                .replace(/^, /, '')
                .replace(/, $/, '');
        }

        setBillingData(prev => ({
            ...prev,
            email: buyer.email,
            name: `${buyer.first_name} ${buyer.last_name}`.trim(),
            fiscal_address: addressToCopy
        }));
    };


    // --- HANDLERS ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (items.length === 0) {
            setError("El carrito está vacío");
            setLoading(false);
            return;
        }

        try {
            // Construct Payload matching Backend Schema
            const orderPayload = {
                items: items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.price
                })),
                buyer: buyer,
                shipping: {
                    method: deliveryMethod,
                    ...(deliveryMethod === 'shipping' ? shippingAddress : {}), // Spread address fields if shipping
                    ...(deliveryMethod === 'pickup' ? pickupData : {}) // Spread pickup fields if pickup
                },
                billing: {
                    invoice_type: invoiceType,
                    name: billingData.name, // Added missing field
                    email: billingData.email || buyer.email,
                    dni: invoiceType === 'B' ? billingData.dni : undefined,
                    cuit: invoiceType === 'A' ? billingData.cuit : undefined,
                    fiscal_address: invoiceType === 'A' ? billingData.fiscal_address : undefined
                }
            };

            const order = await createOrder(orderPayload);

            if (order.payment_url) {
                window.location.href = order.payment_url;
            } else {
                throw new Error("No se recibió la URL de pago");
            }

        } catch (err) {
            console.error(err);
            setError('Hubo un error al procesar tu pedido. Por favor verifica los datos.');
            setLoading(false);
        }
    };

    const totalWithShipping = total + shippingCost;

    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto text-white">
            <Link href="/" className="text-gray-400 hover:text-primary mb-8 inline-block">← Volver a productos</Link>
            <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* --- LEFT COLUMN: FORMS (Span 2) --- */}
                <div className="lg:col-span-2 space-y-8">

                    {/* 1. COMPRADOR */}
                    <section className="bg-card p-6 rounded-xl border border-border">
                        <h2 className="text-xl font-bold text-primary mb-4 border-b border-border pb-2">1. Datos del Comprador</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input required placeholder="Nombre" className="input-field" value={buyer.first_name} onChange={e => setBuyer({ ...buyer, first_name: e.target.value })} />
                            <input required placeholder="Apellido" className="input-field" value={buyer.last_name} onChange={e => setBuyer({ ...buyer, last_name: e.target.value })} />
                            <input required type="email" placeholder="Email" className="input-field" value={buyer.email} onChange={e => setBuyer({ ...buyer, email: e.target.value })} />
                            <input placeholder="Teléfono (Opcional)" className="input-field" value={buyer.phone} onChange={e => setBuyer({ ...buyer, phone: e.target.value })} />
                        </div>
                    </section>

                    {/* 2. ENVÍO / RETIRO */}
                    <section className="bg-card p-6 rounded-xl border border-border">
                        <h2 className="text-xl font-bold text-primary mb-4 border-b border-border pb-2">2. Entrega</h2>

                        <div className="flex gap-4 mb-6">
                            <button type="button" onClick={() => setDeliveryMethod('shipping')}
                                className={`flex-1 p-4 rounded border ${deliveryMethod === 'shipping' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-600 text-gray-400'}`}>
                                🚚 Envío a Domicilio
                            </button>
                            <button type="button" onClick={() => setDeliveryMethod('pickup')}
                                className={`flex-1 p-4 rounded border ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-600 text-gray-400'}`}>
                                🏪 Retiro en Local
                            </button>
                        </div>

                        {deliveryMethod === 'shipping' ? (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="bg-blue-900/20 p-3 rounded text-sm text-blue-200 mb-4">
                                    ℹ️ Solo realizamos envíos dentro de Argentina.
                                </div>
                                <input required placeholder="Dirección (Calle y Altura)" className="input-field w-full" value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Piso / Depto" className="input-field" value={shippingAddress.floor_apt} onChange={e => setShippingAddress({ ...shippingAddress, floor_apt: e.target.value })} />
                                    <input required placeholder="Código Postal" className="input-field" value={shippingAddress.zip_code} onChange={e => setShippingAddress({ ...shippingAddress, zip_code: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input required placeholder="Ciudad" className="input-field" value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                                    <input required placeholder="Provincia" className="input-field" value={shippingAddress.province} onChange={e => setShippingAddress({ ...shippingAddress, province: e.target.value })} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="bg-green-900/20 p-3 rounded text-sm text-green-200 mb-4">
                                    📍 Horarios de atención: Lunes a Viernes de 9 a 18hs.
                                </div>
                                <div className="flex justify-end">
                                    <button type="button" onClick={copyBuyerToPickup} className="text-xs text-primary hover:underline">Usar datos de comprador</button>
                                </div>
                                <input required placeholder="Nombre de quien retira" className="input-field w-full" value={pickupData.pickup_name} onChange={e => setPickupData({ ...pickupData, pickup_name: e.target.value })} />
                                <input required placeholder="DNI de quien retira" className="input-field w-full" value={pickupData.pickup_dni} onChange={e => setPickupData({ ...pickupData, pickup_dni: e.target.value })} />
                            </div>
                        )}
                    </section>

                    {/* 3. FACTURACIÓN */}
                    <section className="bg-card p-6 rounded-xl border border-border">
                        <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
                            <h2 className="text-xl font-bold text-primary">3. Datos de Facturación</h2>
                            <button type="button" onClick={copyBuyerToBilling} className="text-xs text-primary hover:underline">Usar datos de comprador</button>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <button type="button" onClick={() => setInvoiceType('B')}
                                className={`flex-1 p-3 rounded border ${invoiceType === 'B' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-600 text-gray-400'}`}>
                                Factura B (Consumidor Final)
                            </button>
                            <button type="button" onClick={() => setInvoiceType('A')}
                                className={`flex-1 p-3 rounded border ${invoiceType === 'A' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-600 text-gray-400'}`}>
                                Factura A (Responsable Inscripto)
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input required placeholder="Nombre / Razón Social" className="input-field w-full" value={billingData.name} onChange={e => setBillingData({ ...billingData, name: e.target.value })} />
                                <input required type="email" placeholder="Email para envío de factura" className="input-field w-full" value={billingData.email} onChange={e => setBillingData({ ...billingData, email: e.target.value })} />
                            </div>

                            {invoiceType === 'B' ? (
                                <div className="grid grid-cols-1 gap-4">
                                    <input required placeholder="DNI" className="input-field w-full" value={billingData.dni} onChange={e => setBillingData({ ...billingData, dni: e.target.value })} />
                                    <input required placeholder="Dirección (Calle, Altura, Ciudad, Prov)" className="input-field w-full" value={billingData.fiscal_address} onChange={e => setBillingData({ ...billingData, fiscal_address: e.target.value })} />
                                </div>
                            ) : (
                                <>
                                    <input required placeholder="CUIT" className="input-field w-full" value={billingData.cuit} onChange={e => setBillingData({ ...billingData, cuit: e.target.value })} />
                                    <input required placeholder="Dirección Fiscal" className="input-field w-full" value={billingData.fiscal_address} onChange={e => setBillingData({ ...billingData, fiscal_address: e.target.value })} />
                                </>
                            )}
                        </div>
                    </section>

                    {error && <div className="p-4 bg-red-900/30 border border-red-500 rounded text-red-200 text-center">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading || items.length === 0}
                        className="w-full py-5 bg-primary text-black font-bold text-lg rounded-xl hover:bg-yellow-500 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? 'Redirigiendo a Pago...' : 'Confirmar y Pagar'}
                    </button>
                </div>

                {/* --- RIGHT COLUMN: SUMMARY (Span 1) --- */}
                <div className="h-fit sticky top-8">
                    <div className="bg-card p-6 rounded-xl border border-border shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-6">Resumen de Compra</h2>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item) => (
                                <div key={item.product_id} className="flex justify-between items-center border-b border-border pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-500">Img</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-gray-400">Cant: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="text-primary font-bold text-sm">${(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-border mt-6 space-y-2">
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Subtotal</span>
                                <span>${total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-white">
                                <span>Envío <span className="text-xs text-gray-500">({shippingMessage})</span></span>
                                <span className={shippingCost === 0 ? "text-green-400 font-bold" : ""}>
                                    {shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toLocaleString()}`}
                                </span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-primary pt-4 border-t border-border mt-2">
                                <span>Total</span>
                                <span>${totalWithShipping.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </form>

            <style jsx>{`
                .input-field {
                    @apply bg-input border border-border rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-600;
                }
            `}</style>
        </div>
    );
}
