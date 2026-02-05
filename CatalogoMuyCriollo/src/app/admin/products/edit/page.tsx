"use client"

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { Category, Brand } from '@/types/database'

function EditForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Data Options
    const [categories, setCategories] = useState<Category[]>([])
    const [brands, setBrands] = useState<Brand[]>([])

    // Form State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [priority, setPriority] = useState('0')
    const [categoryId, setCategoryId] = useState('')
    const [brandId, setBrandId] = useState('')
    const [stock, setStock] = useState('0')
    // Badge fields
    const [isNew, setIsNew] = useState(false)
    const [isOnSale, setIsOnSale] = useState(false)
    const [originalPrice, setOriginalPrice] = useState('')
    // New images to upload
    const [newImages, setNewImages] = useState<File[]>([])
    const [newImagesPreview, setNewImagesPreview] = useState<string[]>([])
    // Existing images to keep or delete
    const [existingImages, setExistingImages] = useState<any[]>([])

    // Variants
    const [existingVariants, setExistingVariants] = useState<any[]>([])
    const [newVariants, setNewVariants] = useState<{ type: string, value: string }[]>([])
    // Combinations State (Matriz)
    const [combinations, setCombinations] = useState<{ id?: string, attributes: Record<string, string>, stock: number }[]>([])

    useEffect(() => {
        if (id) {
            loadData()
        } else {
            window.location.href = '/admin/products'
        }
    }, [id])

    async function loadData() {
        // Load options
        const { data: cats } = await supabase.from('categories').select('*')
        const { data: brs } = await supabase.from('brands').select('*')
        if (cats) setCategories(cats)
        if (brs) setBrands(brs)

        // Load Product
        const { data: prod, error } = await supabase
            .from('products')
            .select(`*, product_images(*), product_variants(*), product_combinations(*)`)
            .eq('id', id)
            .single()

        if (error || !prod) {
            alert('Producto no encontrado')
            window.location.href = '/admin/products'
            return
        }

        setProductState(prod)
        setLoading(false)
    }

    function setProductState(prod: any) {
        setName(prod.name)
        setDescription(prod.description || '')
        setPrice(prod.price.toString())
        setPriority(prod.priority?.toString() || '0')
        setCategoryId(prod.category_id || '')
        setBrandId(prod.brand_id || '')
        setStock(prod.stock?.toString() || '0')
        // Badge fields
        setIsNew(prod.is_new || false)
        setIsOnSale(prod.is_on_sale || false)
        setOriginalPrice(prod.original_price?.toString() || '')
        // Sort images by display_order
        const images = prod.product_images || []
        images.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        setExistingImages(images)
        setExistingVariants(prod.product_variants || [])

        // Load combinations if any
        if (prod.product_combinations && prod.product_combinations.length > 0) {
            setCombinations(prod.product_combinations)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setNewImages((prev) => [...prev, ...newFiles])

            const newPreviews = newFiles.map(file => URL.createObjectURL(file))
            setNewImagesPreview((prev) => [...prev, ...newPreviews])
        }
    }

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index))
        setNewImagesPreview(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingImage = async (imageId: string) => {
        if (!confirm('¿Eliminar esta imagen?')) return

        const { error } = await supabase.from('product_images').delete().eq('id', imageId)
        if (!error) {
            setExistingImages(prev => prev.filter(img => img.id !== imageId))
        } else {
            alert('Error al borrar imagen')
        }
    }

    // Variants Logic
    const addNewVariant = () => {
        setNewVariants([...newVariants, { type: '', value: '' }])
    }

    const removeNewVariant = (index: number) => {
        setNewVariants(newVariants.filter((_, i) => i !== index))
    }

    const updateNewVariant = (index: number, field: 'type' | 'value', val: string) => {
        const copy = [...newVariants]
        copy[index][field] = val
        setNewVariants(copy)
    }

    const removeExistingVariant = async (variantId: string) => {
        // Optimistic update
        const backup = [...existingVariants]
        setExistingVariants(prev => prev.filter(v => v.id !== variantId))

        const { error } = await supabase.from('product_variants').delete().eq('id', variantId)
        if (error) {
            alert('Error al borrar variante')
            setExistingVariants(backup)
        }
    }

    // Matrix Helpers
    const generateCombinations = () => {
        // Collect all variants (existing + new)
        const allVariants = [...existingVariants, ...newVariants]

        // 1. Group by Type
        const grouped: Record<string, string[]> = {}
        allVariants.forEach(v => {
            if (v.type && v.value) {
                const type = v.type.trim()
                const value = v.value.trim()
                if (type && value) {
                    if (!grouped[type]) grouped[type] = []
                    if (!grouped[type].includes(value)) grouped[type].push(value)
                }
            }
        })

        const types = Object.keys(grouped)
        if (types.length === 0) {
            if (combinations.length > 0 && confirm("Esto borrará todas las combinaciones existentes. ¿Continuar?")) {
                setCombinations([])
            }
            return
        }

        // 2. Cartesian Product
        const cartesian = (args: string[][]): any[][] => {
            const r: any[][] = []
            const max = args.length - 1
            const helper = (arr: any[], i: number) => {
                for (let j = 0, l = args[i].length; j < l; j++) {
                    const a = arr.slice(0) // clone
                    a.push(args[i][j])
                    if (i == max) r.push(a)
                    else helper(a, i + 1)
                }
            }
            helper([], 0)
            return r
        }

        const valuesMatrix = types.map(t => grouped[t])
        const combinationsRaw = cartesian(valuesMatrix)

        // 3. Merge with existing combinations to preserve stock
        const newCombinations = combinationsRaw.map((comboValues) => {
            const attributes: Record<string, string> = {}
            types.forEach((t, tIdx) => {
                attributes[t] = comboValues[tIdx]
            })

            // Check if exists
            const existing = combinations.find(c => {
                // Check if all attributes match
                const keysA = Object.keys(c.attributes)
                const keysB = Object.keys(attributes)
                if (keysA.length !== keysB.length) return false
                return keysA.every(key => c.attributes[key] === attributes[key])
            })

            if (existing) {
                return existing
            }

            return {
                attributes,
                stock: 0
            }
        })

        setCombinations(newCombinations)
    }

    const updateCombinationStock = (index: number, val: string) => {
        const newCombs = [...combinations]
        newCombs[index].stock = parseInt(val) || 0
        setCombinations(newCombs)
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            // Calculate total stock
            const totalStock = combinations.length > 0
                ? combinations.reduce((acc, c) => acc + c.stock, 0)
                : (parseInt(stock) || 0)

            // 1. Update Product
            const { error: prodError } = await supabase
                .from('products')
                .update({
                    name,
                    description,
                    price: parseFloat(price),
                    priority: parseInt(priority) || 0,
                    category_id: categoryId || null,
                    brand_id: brandId || null,
                    is_new: isNew,
                    is_on_sale: isOnSale,
                    original_price: isOnSale && originalPrice ? parseFloat(originalPrice) : null,
                    stock: totalStock,
                })
                .eq('id', id)

            if (prodError) throw prodError

            // 2. Upload New Images
            if (newImages.length > 0) {
                // Get current max display order
                const maxOrder = existingImages.reduce((max, img) => Math.max(max, img.display_order || 0), 0)

                for (let i = 0; i < newImages.length; i++) {
                    const file = newImages[i]
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${id}/${Math.random()}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('products')
                        .upload(fileName, file)

                    if (uploadError) throw uploadError

                    const { data: publicUrlData } = supabase.storage
                        .from('products')
                        .getPublicUrl(fileName)

                    await supabase.from('product_images').insert({
                        product_id: id,
                        url: publicUrlData.publicUrl,
                        display_order: maxOrder + 1 + i
                    })
                }
            }

            // 3. Insert New Variants
            if (newVariants.length > 0) {
                const validVariants = newVariants.filter(v => v.type.trim() !== '' && v.value.trim() !== '')
                if (validVariants.length > 0) {
                    const { error: varError } = await supabase
                        .from('product_variants')
                        .insert(validVariants.map(v => ({
                            product_id: id,
                            type: v.type,
                            value: v.value
                        })))

                    if (varError) throw varError
                }
            }

            // 4. Update/Insert Combinations
            if (combinations.length > 0) {
                // Determine which combinations to keep
                const submittedIds = combinations.map(c => c.id).filter(id => id && !id.startsWith('temp-'))

                // Get current DB combinations
                const { data: currentDbCombs } = await supabase.from('product_combinations').select('id').eq('product_id', id)

                if (currentDbCombs) {
                    const toDelete = currentDbCombs.filter(db => !submittedIds.includes(db.id))
                    if (toDelete.length > 0) {
                        const { error: delError } = await supabase.from('product_combinations').delete().in('id', toDelete.map(d => d.id))
                        if (delError) console.error("Error deleting old combos:", delError)
                    }
                }

                for (const c of combinations) {
                    if (c.id && !c.id.startsWith('temp-')) {
                        const { error: updateError } = await supabase.from('product_combinations').update({
                            stock: c.stock,
                            attributes: c.attributes
                        }).eq('id', c.id)
                        if (updateError) throw updateError
                    } else {
                        const { error: insertError } = await supabase.from('product_combinations').insert({
                            product_id: id,
                            attributes: c.attributes,
                            stock: c.stock
                        })
                        if (insertError) throw insertError
                    }
                }
            } else {
                // If combinations cleared, delete all
                await supabase.from('product_combinations').delete().eq('product_id', id)
            }

            window.location.href = '/admin/products'
        } catch (error: any) {
            alert('Error: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center bg-card rounded-lg">Cargando...</div>

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <a href="/admin/products" className="p-2 hover:bg-muted rounded-full text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </a>
                <h1 className="text-2xl font-bold">Editar Producto</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Nombre del Producto</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 rounded-md border bg-background"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Precio</label>
                        <input
                            required
                            type="number"
                            className="w-full px-3 py-2 rounded-md border bg-background"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Prioridad (Orden)</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full px-3 py-2 rounded-md border bg-background"
                            value={priority}
                            onChange={e => setPriority(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Mayor número = Aparece primero.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Categoría</label>
                        <select
                            className="w-full px-3 py-2 rounded-md border bg-background"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Marca</label>
                        <select
                            className="w-full px-3 py-2 rounded-md border bg-background"
                            value={brandId}
                            onChange={e => setBrandId(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                    {/* Stock Simple */}
                    {combinations.length === 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Stock Base</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 rounded-md border bg-background"
                                value={stock}
                                onChange={e => setStock(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Badge Options */}
                <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-3">Etiquetas de Producto</label>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isNew}
                                onChange={e => setIsNew(e.target.checked)}
                                className="w-4 h-4 rounded border-border accent-primary"
                            />
                            <span className="text-sm">Marcar como <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded ml-1">Nuevo</span></span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isOnSale}
                                onChange={e => setIsOnSale(e.target.checked)}
                                className="w-4 h-4 rounded border-border accent-primary"
                            />
                            <span className="text-sm">Marcar como <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-1">Oferta</span></span>
                        </label>
                        {isOnSale && (
                            <div className="ml-7">
                                <label className="block text-sm text-muted-foreground mb-1">Precio Original (tachado)</label>
                                <input
                                    type="number"
                                    placeholder="Ej: 300000"
                                    className="w-40 px-3 py-2 rounded-md border bg-background text-sm"
                                    value={originalPrice}
                                    onChange={e => setOriginalPrice(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <textarea
                        className="w-full px-3 py-2 rounded-md border bg-background min-h-[100px]"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>

                {/* Variants */}
                <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">Variantes</label>
                        <button type="button" onClick={addNewVariant} className="text-sm text-primary hover:underline flex items-center gap-1">
                            <Upload className="h-3 w-3 rotate-90" /> Agregar Variante
                        </button>
                    </div>

                    <div className="space-y-2 mb-4">
                        {/* Existing */}
                        {existingVariants.map((v) => (
                            <div key={v.id} className="flex gap-2 items-center bg-muted/20 p-2 rounded">
                                <span className="flex-1 text-sm font-medium">{v.type}: {v.value}</span>
                                <button
                                    type="button"
                                    onClick={() => removeExistingVariant(v.id)}
                                    className="text-destructive hover:underline text-xs"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}

                        {/* New */}
                        {newVariants.map((v, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Tipo (ej: Color)"
                                    className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                                    value={v.type}
                                    onChange={e => updateNewVariant(idx, 'type', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Valor (ej: Rojo)"
                                    className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                                    value={v.value}
                                    onChange={e => updateNewVariant(idx, 'value', e.target.value)}
                                />
                                <button type="button" onClick={() => removeNewVariant(idx)} className="p-2 text-destructive hover:bg-destructive/10 rounded">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={generateCombinations}
                        className="btn btn-secondary w-full text-sm"
                        disabled={existingVariants.length === 0 && newVariants.length === 0}
                    >
                        Generar/Actualizar Matriz de Combinaciones
                    </button>
                </div>

                {/* Stock Matrix Table */}
                {combinations.length > 0 && (
                    <div className="border border-border rounded-md overflow-hidden bg-muted/10">
                        <div className="p-2 bg-muted/20 font-medium text-sm border-b flex justify-between">
                            <span>Combinación</span>
                            <span>Stock</span>
                        </div>
                        <div className="divide-y divide-border/50">
                            {combinations.map((c, idx) => (
                                <div key={c.id || idx} className="p-2 flex items-center justify-between text-sm">
                                    <div className="flex gap-2">
                                        {Object.entries(c.attributes).map(([k, v]) => (
                                            <span key={k} className="bg-background border rounded px-1.5 py-0.5 text-xs text-muted-foreground">
                                                {k}: <span className="text-foreground">{v}</span>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-20 px-2 py-1 rounded border bg-background text-right"
                                        value={c.stock}
                                        onChange={e => updateCombinationStock(idx, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="p-2 text-xs text-right text-muted-foreground border-t">
                            Total Calculado: {combinations.reduce((acc, c) => acc + c.stock, 0)}
                        </div>
                    </div>
                )}

                {/* Images */}
                <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2">Imágenes Existentes</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                        {existingImages.map((img) => (
                            <div key={img.id} className="relative aspect-square rounded-md overflow-hidden border group">
                                <img src={img.url} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeExistingImage(img.id)}
                                    className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Eliminar imagen"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <label className="block text-sm font-medium mb-2">Agregar Nuevas Imágenes</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                        {newImagesPreview.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                                <img src={url} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeNewImage(idx)}
                                    className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full shadow-sm hover:bg-destructive/90"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Subir</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full btn btn-primary py-2"
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>

            </form>
        </div>
    )
}

export default function EditProductPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <EditForm />
        </Suspense>
    )
}
