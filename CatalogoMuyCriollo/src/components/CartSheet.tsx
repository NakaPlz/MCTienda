import { useCart } from '@/context/CartContext'
import { X, Trash2, Send, Minus, Plus, MessageCircle } from 'lucide-react'
import { useState } from 'react'

interface CartSheetProps {
    isOpen: boolean
    onClose: () => void
}

export function CartSheet({ isOpen, onClose }: CartSheetProps) {
    const { items, removeItem, updateQuantity, totalItems } = useCart()
    const [isSending, setIsSending] = useState(false)

    if (!isOpen) return null

    const handleSendWhatsApp = () => {
        setIsSending(true)

        let body = "Hola! Quiero realizar el siguiente pedido:\n\n"

        items.forEach((item) => {
            body += `* ${item.product.name} (${item.quantity}u)`
            if (item.variants && item.variants.length > 0) {
                const variantsStr = item.variants.map(v => `${v.type}: ${v.value}`).join(', ')
                body += ` [${variantsStr}]`
            }
            body += ` - $${(item.product.price * item.quantity).toLocaleString('es-AR')}\n`
        })

        const total = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
        body += `\n*Total estimado: $${total.toLocaleString('es-AR')}*\n\n`
        body += "Quedo a la espera de la confirmación. Gracias!"

        const phoneNumber = "5491127006367"
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(body)}`

        window.open(whatsappLink, '_blank')
        setIsSending(false)
    }

    const getVariantKey = (variants: any[]) => variants.map(v => v.id).sort().join('-')

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-background shadow-xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Tu Consulta ({totalItems})</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No tienes productos seleccionados.</p>
                        </div>
                    ) : (
                        items.map((item, idx) => {
                            const variantKey = item.variants ? getVariantKey(item.variants) : ''
                            return (
                                <div key={`${item.product.id}-${idx}`} className="flex gap-4 p-3 bg-muted/20 rounded-lg border">
                                    <div className="h-20 w-20 bg-card rounded overflow-hidden flex-shrink-0 border">
                                        {item.product.product_images?.[0] ? (
                                            <img
                                                src={item.product.product_images[0].url}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-sm truncate pr-2">{item.product.name}</h4>
                                                <button
                                                    onClick={() => removeItem(item.product.id, variantKey)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            {item.variants && item.variants.length > 0 && (
                                                <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                                                    {item.variants.map((v) => (
                                                        <span key={v.id} className="inline-block mr-2 bg-background px-1.5 py-0.5 rounded border">
                                                            {v.type}: {v.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-semibold">${(item.product.price * item.quantity).toLocaleString('es-AR')}</span>

                                            <div className="flex items-center gap-3 bg-background border rounded-md px-2 py-1">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, variantKey, -1)}
                                                    className="text-muted-foreground hover:text-primary disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, variantKey, 1)}
                                                    className="text-muted-foreground hover:text-primary"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="p-4 border-t bg-muted/20">
                    <button
                        onClick={handleSendWhatsApp}
                        disabled={items.length === 0}
                        className="w-full btn btn-primary py-3 gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-[#25D366] hover:bg-[#128C7E] text-white"
                    >
                        <MessageCircle className="h-5 w-5" />
                        Enviar Pedido por WhatsApp
                    </button>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                        Se abrirá WhatsApp con el detalle de tu pedido.
                    </p>
                </div>
            </div>
        </div>
    )
}
