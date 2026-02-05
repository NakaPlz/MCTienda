import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 p-8">
                <h1 className="text-8xl font-bold text-primary">404</h1>
                <h2 className="text-2xl font-semibold text-foreground">Página no encontrada</h2>
                <p className="text-muted-foreground max-w-md">
                    Lo sentimos, la página que estás buscando no existe o fue movida.
                </p>
                <Link
                    href="/"
                    className="inline-block btn btn-primary px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    )
}
