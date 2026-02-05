'use client';

import Link from 'next/link';

export default function PendingPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-6">⏳</div>
            <h1 className="text-4xl text-yellow-500 font-bold mb-4 font-heading">Pago Pendiente</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-md">Tu pago está siendo procesado. Te avisaremos cuando se confirme.</p>

            <Link href="/" className="px-8 py-4 bg-primary text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors shadow-lg">
                Volver a la Tienda
            </Link>
        </div>
    );
}
