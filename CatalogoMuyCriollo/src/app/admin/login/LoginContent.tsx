"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginContent() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
        } else {
            window.location.href = '/admin/dashboard'
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
            <div className="w-full max-w-sm p-6 bg-card rounded-lg shadow-lg border animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-primary">Admin Muy Criollo</h1>
                    <p className="text-sm text-muted-foreground mt-2">Ingresa tus credenciales</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border bg-background focus:ring-1 focus:ring-primary outline-none"
                            placeholder="admin@muycriollo.com.ar"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border bg-background focus:ring-1 focus:ring-primary outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary py-2"
                    >
                        {loading ? 'Ingresando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
