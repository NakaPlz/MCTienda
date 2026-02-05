"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, LogOut, PlusCircle } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [userEmail, setUserEmail] = useState<string>('')

    // Check if we are on the login page (handle trailing slash)
    const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/'

    useEffect(() => {
        async function checkAuth() {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (isLoginPage) {
                if (session) {
                    window.location.href = '/admin/dashboard'
                    return
                }
                setAuthorized(true)
                setLoading(false)
            } else {
                if (!session) {
                    // Force redirect and keep loading
                    window.location.replace('/admin/login')
                } else {
                    setUserEmail(session.user.email || 'Admin')
                    setAuthorized(true)
                    setLoading(false)
                }
            }
        }
        checkAuth()
    }, [pathname, router, isLoginPage])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/admin/login'
    }

    if (loading || !authorized) {
        return <div className="h-screen flex items-center justify-center bg-background text-foreground">Verificando sesión...</div>
    }

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen grid grid-cols-[240px_1fr]">
            {/* Sidebar */}
            <aside className="border-r bg-muted/10 p-4 flex flex-col h-screen sticky top-0">
                <div className="font-bold text-xl mb-2 px-2 text-primary">Panel Admin</div>
                <div className="text-xs text-muted-foreground px-2 mb-6 break-all">
                    {userEmail}
                </div>

                <nav className="space-y-1 flex-1">
                    <a
                        href="/admin/dashboard"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${pathname === '/admin/dashboard' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                            }`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </a>
                    <a
                        href="/admin/stock"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${pathname === '/admin/stock' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                            }`}
                    >
                        <Package className="h-4 w-4" />
                        Control Stock
                    </a>
                    <a
                        href="/admin/products"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/admin/products') && pathname !== '/admin/products/new' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                            }`}
                    >
                        <Package className="h-4 w-4" />
                        Publicaciones
                    </a>
                    <a
                        href="/admin/products/new"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${pathname === '/admin/products/new' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                            }`}
                    >
                        <PlusCircle className="h-4 w-4" />
                        Nuevo Producto
                    </a>

                    <div className="pt-4 pb-2 text-xs font-semibold text-muted-foreground px-3">Configuración</div>

                    <a
                        href="/admin/categories"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/admin/categories') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                            }`}
                    >
                        Categorías
                    </a>
                    <a
                        href="/admin/brands"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/admin/brands') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                            }`}
                    >
                        Marcas
                    </a>
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors mt-auto"
                >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                </button>
            </aside>

            {/* Content */}
            <main className="p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
