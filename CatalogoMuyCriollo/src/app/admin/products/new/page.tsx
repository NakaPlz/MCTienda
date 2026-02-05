"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { Category, Brand } from '@/types/database'

export default function NewProductPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

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
    const [images, setImages] = useState<File[]>([])
    const [imagePreview, setImagePreview] = useState<string[]>([])
    // Badge fields
    const [isNew, setIsNew] = useState(false)
    const [isOnSale, setIsOnSale] = useState(false)
    const [originalPrice, setOriginalPrice] = useState('')

    // Variants State
    const [variants, setVariants] = useState<{ type: string, value: string }[]>([])
    // Combinations State (Matriz)
    const [combinations, setCombinations] = useState<{ id: string, attributes: Record<string, string>, stock: number }[]>([])

    useEffect(() => {
        async function loadOptions() {
            const { data: cats } = await supabase.from('categories').select('*')
            const { data: brs } = await supabase.from('brands').select('*')
            if (cats) setCategories(cats)
            if (brs) setBrands(brs)
        }
        loadOptions()
    }, [])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setImages((prev) => [...prev, ...newFiles])

            const newPreviews = newFiles.map(file => URL.createObjectURL(file))
            setImagePreview((prev) => [...prev, ...newPreviews])
        }
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
        setImagePreview(prev => prev.filter((_, i) => i !== index))
    }

    // Variant Helpers
    const addVariant = () => {
        setVariants([...variants, { type: '', value: '' }])
    }

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index))
    }

    const updateVariant = (index: number, field: 'type' | 'value', val: string) => {
        const newVariants = [...variants]
        newVariants[index][field] = val
        setVariants(newVariants)
    }

    // Matrix Helpers
    const generateCombinations = () => {
        // 1. Group by Type
        const grouped: Record<string, string[]> = {}
        variants.forEach(v => {
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
            setCombinations([])
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

        const newCombinations = combinationsRaw.map((comboValues, idx) => {
            const attributes: Record<string, string> = {}
            types.forEach((t, tIdx) => {
                attributes[t] = comboValues[tIdx]
            })
            return {
                id: `temp-${Math.random()}`,
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
        setLoading(true)

        try {
            // 1. Create Product
            // Calculate total stock from combinations if they exist, otherwise use basic stock
            const totalStock = combinations.length > 0
                ? combinations.reduce((acc, c) => acc + c.stock, 0)
                : (parseInt(stock) || 0)

            const { data: product, error: prodError } = await supabase
                .from('products')
                .insert({
                    name,
                    description,
                    price: parseFloat(price),
                    priority: parseInt(priority) || 0,
                    category_id: categoryId || null,
                    brand_id: brandId || null,
                    is_new: isNew,
                    is_on_sale: isOnSale,
                    original_price: isOnSale && originalPrice ? parseFloat(originalPrice) : null,
                    active: true,
                    stock: totalStock
                })
                .select()
                .single()

            if (prodError) throw prodError
            if (!product) throw new Error('No se creó el producto')

            // 2. Upload Images
            if (images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const file = images[i]
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${product.id}/${Math.random()}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('products')
                        .upload(fileName, file)

                    if (uploadError) throw uploadError

                    const { data: publicUrlData } = supabase.storage
                        .from('products')
                        .getPublicUrl(fileName)

                    await supabase.from('product_images').insert({
                        product_id: product.id,
                        url: publicUrlData.publicUrl,
                        display_order: i
                    })
                }
            }

            // 3. Insert Variants (Definitions)
            if (variants.length > 0) {
                const validVariants = variants.filter(v => v.type.trim() !== '' && v.value.trim() !== '')
                if (validVariants.length > 0) {
                    const { error: varError } = await supabase
                        .from('product_variants')
                        .insert(validVariants.map(v => ({
                            product_id: product.id,
                            type: v.type,
                            value: v.value
                        })))

                    if (varError) throw varError
                }
            }

            // 4. Insert Combinations
            if (combinations.length > 0) {
                const { error: comboError } = await supabase
                    .from('product_combinations')
                    .insert(combinations.map(c => ({
                        product_id: product.id,
                        attributes: c.attributes,
                        stock: c.stock
                    })))

                if (comboError) throw comboError
            }

            window.location.href = '/admin/products'
        } catch (error: any) {
            alert('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <a href="/admin/products" className="p-2 hover:bg-muted rounded-full text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </a>
                <h1 className="text-2xl font-bold">Nuevo Producto</h1>
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

                    {/* Stock Simple (Solo si NO hay combinaciones) */}
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

                <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <textarea
                        className="w-full px-3 py-2 rounded-md border bg-background min-h-[100px]"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
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

                {/* Variants Logic Update */}
                <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">Definir Variantes</label>
                        <button type="button" onClick={addVariant} className="text-sm text-primary hover:underline flex items-center gap-1">
                            <Upload className="h-3 w-3 rotate-90" /> Agregar
                        </button>
                    </div>

                    <div className="space-y-2 mb-4">
                        {variants.map((v, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Tipo (ej: Color)"
                                    className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                                    value={v.type}
                                    onChange={e => updateVariant(idx, 'type', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Valor (ej: Rojo)"
                                    className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                                    value={v.value}
                                    onChange={e => updateVariant(idx, 'value', e.target.value)}
                                />
                                <button type="button" onClick={() => removeVariant(idx)} className="p-2 text-destructive hover:bg-destructive/10 rounded">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={generateCombinations}
                        className="btn btn-secondary w-full text-sm"
                        disabled={variants.length === 0}
                    >
                        Generar Matriz de Combinaciones
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
                                <div key={c.id} className="p-2 flex items-center justify-between text-sm">
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
                    <label className="block text-sm font-medium mb-2">Imágenes</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                        {imagePreview.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                                <img src={url} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
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
                        disabled={loading}
                        className="w-full btn btn-primary py-2"
                    >
                        {loading ? 'Guardando...' : 'Crear Producto'}
                    </button>
                </div>

            </form>
        </div>
    )
}
