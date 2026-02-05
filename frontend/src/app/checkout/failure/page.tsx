'use client';

import Link from 'next/link';

export default function FailurePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-4xl text-red-500 font-bold mb-4 font-heading">Hubo un problema</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-md">No pudimos procesar tu pago. Por favor intenta nuevamente.</p>

            <div className="flex gap-4">
                <Link href="/checkout" className="px-6 py-3 border border-primary text-primary font-bold rounded hover:bg-primary/10 transition-colors">
                    Intentar de nuevo
                </Link>
                <Link href="/" className="px-6 py-3 text-gray-400 hover:text-white transition-colors">
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
