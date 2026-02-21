'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Package, LayoutDashboard, Percent, Tag, LogOut, Bookmark, Ruler } from 'lucide-react';

function ShellContent({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, logout } = useAuth();
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <main className="w-full h-full">{children}</main>;
    }

    if (!isAuthenticated) return null; // AuthProvider will redirect

    return (
        <>
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border flex flex-col fixed h-full z-10">
                <div className="h-16 flex items-center justify-center border-b border-border">
                    <h1 className="text-xl font-bold text-primary">Muy Criollo Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link href="/" className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${pathname === '/' ? 'bg-secondary text-primary' : 'text-gray-400 hover:bg-secondary hover:text-primary'}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/products" className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${pathname.startsWith('/products') ? 'bg-secondary text-primary' : 'text-gray-400 hover:bg-secondary hover:text-primary'}`}>
                        <Package size={20} />
                        <span>Productos</span>
                    </Link>
                    <Link href="/prices" className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${pathname === '/prices' ? 'bg-secondary text-primary' : 'text-gray-400 hover:bg-secondary hover:text-primary'}`}>
                        <Percent size={20} />
                        <span>Precios</span>
                    </Link>
                    <Link href="/categories" className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${pathname === '/categories' ? 'bg-secondary text-primary' : 'text-gray-400 hover:bg-secondary hover:text-primary'}`}>
                        <Tag size={20} />
                        <span>Categorías</span>
                    </Link>
                    <Link href="/labels" className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${pathname === '/labels' ? 'bg-secondary text-primary' : 'text-gray-400 hover:bg-secondary hover:text-primary'}`}>
                        <Bookmark size={20} />
                        <span>Etiquetas</span>
                    </Link>
                    <Link href="/size-guides" className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${pathname.startsWith('/size-guides') ? 'bg-secondary text-primary' : 'text-gray-400 hover:bg-secondary hover:text-primary'}`}>
                        <Ruler size={20} />
                        <span>Guías de Talles</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-red-400 w-full px-4 py-2 transition-colors">
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                    <div className="text-xs text-center text-gray-600 mt-2">v1.1.0</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-background ml-64 min-h-screen">
                {children}
            </main>
        </>
    );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ShellContent>{children}</ShellContent>
        </AuthProvider>
    );
}
