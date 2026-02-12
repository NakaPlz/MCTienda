'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, Trash2, GripVertical, X } from 'lucide-react';
import { fetchProducts, updateProductPrice, addProductImage, deleteImage, reorderImage, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { API_URL } from '@/lib/api';

// Types (Ideally shared or imported from a types file)
interface ProductImage {
    id: number;
    url: string;
    display_order: number;
    color_variant?: string;
}

interface Label {
    id: number;
    name: string;
    color: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    image_url?: string;
    description?: string;
    categories?: { id: number; name: string }[]; // New relation
    labels?: Label[]; // New relation
    price_override?: number;
    discount_percentage?: number;
    product_images?: ProductImage[]; // New relation
    images?: string[]; // Legacy
}

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrapParams = use(params);
    const router = useRouter();
    const { token } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    // Price State
    const [priceOverride, setPriceOverride] = useState<string>('');
    const [discount, setDiscount] = useState<string>('');

    // Image State
    const [newImageUrl, setNewImageUrl] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [allLabels, setAllLabels] = useState<Label[]>([]);

    useEffect(() => {
        loadProduct();
        fetch(`${API_URL}/admin/categories`)
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error(err));

        if (token) {
            fetch(`${API_URL}/admin/labels/`, {
                headers: { 'x-admin-key': token }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setAllLabels(data);
                    else setAllLabels([]);
                })
                .catch(err => {
                    console.error("Error fetching labels:", err);
                    setAllLabels([]);
                });
        }
    }, [unwrapParams.id, token]);

    async function loadProduct() {
        setLoading(true);
        try {
            // We use fetchProducts with search=id or just fetch details endpoint?
            // We need a proper getProduct endpoint in admin api. 
            // For now, let's look it up in the list logic or create fetchProduct in api.ts
            // Actually api.ts fetchProducts returns an array. 
            // Let's assume we can fetch by ID from frontend public API or add getProduct to admin api.
            // Let's add getProduct(id) to admin/lib/api.ts for clarity.

            // TEMPORARY: Fetch all and find (Inefficient but works for now without new Admin Endpoint for Detail)
            // Better: Use PUBLIC detail endpoint `${API_URL}/products/{id}` which returns the Product model (which includes admin fields? No, schemas need update).
            // Admin schemas in backend DO include admin fields.
            // So public GET /products/{id} MIGHT return them if using the same schema?
            // Let's check backend/schemas.py... Product includes ProductBase + Admin Fields. 
            // So yes, PUBLIC endpoint returns admin fields currently! (Security risk? Maybe later separating schemas).

            const res = await fetch(`${API_URL}/products/${unwrapParams.id}`);
            if (!res.ok) throw new Error("Product not found");
            const data = await res.json();

            setProduct(data);
            setPriceOverride(data.price_override?.toString() || '');
            setDiscount(data.discount_percentage?.toString() || '');

        } catch (e) {
            console.error(e);
            // router.push('/products');
        } finally {
            setLoading(false);
        }
    }

    async function handleSavePrice() {
        if (!product) return;
        try {
            const pOverride = priceOverride ? parseFloat(priceOverride) : undefined;
            const pDiscount = discount ? parseInt(discount) : undefined; // Allow 0

            await updateProductPrice(product.id, pOverride, pDiscount);
            alert('Precio actualizado correctamente');
            loadProduct(); // Reload
        } catch (e) {
            alert('Error al actualizar precio');
        }
    }

    async function handleAddImage() {
        if (!product || !newImageUrl) return;
        try {
            await addProductImage(product.id, newImageUrl, (product.product_images?.length || 0) + 1);
            setNewImageUrl('');
            loadProduct();
        } catch (e) {
            alert('Error al agregar imagen');
        }
    }

    async function handleDeleteImage(imgId: number) {
        if (!confirm('¿Eliminar imagen?')) return;
        try {
            await deleteImage(imgId);
            loadProduct();
        } catch (e) {
            alert('Error al eliminar imagen');
        }
    }

    if (loading) return <div className="p-8 text-foreground">Cargando...</div>;
    if (!product) return <div className="p-8 text-foreground">Producto no encontrado</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <Link href="/products" className="flex items-center gap-2 text-gray-400 hover:text-foreground mb-6 w-fit transition-colors">
                <ArrowLeft size={20} /> Volver
            </Link>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
                    <p className="text-gray-400 font-mono mt-1">SKU: {product.sku}</p>
                </div>
                {/* <div className={`badge ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-3 py-1 rounded-full`}>
                {product.is_active ? 'Activo' : 'Inactivo'}
            </div> */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Prices & Info */}
                <div className="space-y-6">

                    {/* Price Card */}
                    <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                            Precios y Descuentos
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Precio Base (Importado)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={`$${product.price.toLocaleString('es-AR')}`}
                                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-gray-400"
                                />
                            </div>

                            <div className="pt-4 border-t border-border">
                                <label className="block text-sm font-medium text-foreground mb-1">Precio Manual (Opcional)</label>
                                <p className="text-xs text-gray-500 mb-2">Sobrescribe el precio base.</p>
                                <input
                                    type="number"
                                    placeholder="Ej: 15000"
                                    value={priceOverride}
                                    onChange={(e) => setPriceOverride(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Descuento (%)</label>
                                <input
                                    type="number"
                                    placeholder="Ej: 10"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                                />
                            </div>

                            <button
                                onClick={handleSavePrice}
                                className="w-full py-2 bg-primary hover:bg-yellow-600 text-primary-foreground rounded-lg font-medium flex justify-center items-center gap-2 mt-4 transition-colors"
                            >
                                <Save size={18} /> Guardar Cambios
                            </button>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
                        <h3 className="text-lg font-bold mb-4 text-foreground">Información</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block text-gray-400 mb-2">Categorías</label>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(product.categories || []).map((cat: any) => (
                                        <span key={cat.id} className="bg-primary/20 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
                                            {cat.name}
                                            <button
                                                onClick={async () => {
                                                    const newCats = (product.categories || []).filter((c: any) => c.id !== cat.id).map((c: any) => c.name);
                                                    try {
                                                        const res = await fetch(`${API_URL}/admin/products/${product.id}/details`, {
                                                            method: 'PUT',
                                                            headers: getAuthHeaders(),
                                                            body: JSON.stringify({ category_names: newCats })
                                                        });
                                                        if (res.ok) {
                                                            const updated = await res.json();
                                                            // Backend returns updated product (including categories relation hopefully?)
                                                            // If backend returns updated product with categories, we use it.
                                                            // We need to ensure backend serialization includes categories.
                                                            // Let's reload product to be safe or manually update state.
                                                            // Manual update:
                                                            setProduct({
                                                                ...product,
                                                                categories: (product.categories || []).filter((c: any) => c.id !== cat.id)
                                                            });
                                                        }
                                                    } catch (e) { alert('Error Removing Category'); }
                                                }}
                                                className="hover:text-red-400"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <select
                                    value=""
                                    onChange={async (e) => {
                                        const catName = e.target.value;
                                        if (!catName) return;

                                        const currentCats = (product.categories || []).map((c: any) => c.name);
                                        if (currentCats.includes(catName)) return;

                                        const newCats = [...currentCats, catName];

                                        try {
                                            const res = await fetch(`${API_URL}/admin/products/${product.id}/details`, {
                                                method: 'PUT',
                                                headers: getAuthHeaders(),
                                                body: JSON.stringify({ category_names: newCats })
                                            });
                                            if (res.ok) {
                                                // Optimistic or logic update
                                                const catObj = categories.find(c => c.name === catName);
                                                if (catObj) {
                                                    setProduct({
                                                        ...product,
                                                        categories: [...(product.categories || []), catObj]
                                                    });
                                                }
                                            }
                                        } catch (e) { alert('Error Adding Category'); }
                                    }}
                                    className="w-full bg-background border border-border rounded px-2 py-1 text-foreground focus:ring-2 focus:ring-primary text-sm"
                                >
                                    <option value="">+ Agregar Categoría</option>
                                    {categories.filter(c => !(product.categories || []).some((pc: any) => pc.id === c.id)).map((cat: any) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <hr className="border-border my-4" />

                            {/* Labels */}
                            <div>
                                <label className="block text-gray-400 mb-2">Etiquetas</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(product.labels || []).map((label: Label) => (
                                        <span
                                            key={label.id}
                                            className="px-2 py-1 rounded text-xs flex items-center gap-1 text-white shadow-sm"
                                            style={{ backgroundColor: label.color }}
                                        >
                                            {label.name}
                                            <button
                                                onClick={async () => {
                                                    const newLabelIds = (product.labels || []).filter(l => l.id !== label.id).map(l => l.id);
                                                    try {
                                                        const res = await fetch(`${API_URL}/admin/products/${product.id}/details`, {
                                                            method: 'PUT',
                                                            headers: getAuthHeaders(),
                                                            body: JSON.stringify({ label_ids: newLabelIds })
                                                        });
                                                        if (res.ok) {
                                                            setProduct({
                                                                ...product,
                                                                labels: (product.labels || []).filter(l => l.id !== label.id)
                                                            });
                                                        }
                                                    } catch (e) { alert('Error Removing Label'); }
                                                }}
                                                className="hover:text-black/50 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <select
                                    value=""
                                    onChange={async (e) => {
                                        const labelId = parseInt(e.target.value);
                                        if (!labelId) return;

                                        const currentLabels = (product.labels || []).map(l => l.id);
                                        if (currentLabels.includes(labelId)) return;

                                        const newLabelIds = [...currentLabels, labelId];

                                        try {
                                            const res = await fetch(`${API_URL}/admin/products/${product.id}/details`, {
                                                method: 'PUT',
                                                headers: getAuthHeaders(),
                                                body: JSON.stringify({ label_ids: newLabelIds })
                                            });
                                            if (res.ok) {
                                                const labelObj = allLabels.find(l => l.id === labelId);
                                                if (labelObj) {
                                                    setProduct({
                                                        ...product,
                                                        labels: [...(product.labels || []), labelObj]
                                                    });
                                                }
                                            }
                                        } catch (e) { alert('Error Adding Label'); }
                                    }}
                                    className="w-full bg-background border border-border rounded px-2 py-1 text-foreground focus:ring-2 focus:ring-primary text-sm"
                                >
                                    <option value="">+ Agregar Etiqueta</option>
                                    {allLabels.filter(l => !(product.labels || []).some(pl => pl.id === l.id)).map(label => (
                                        <option key={label.id} value={label.id}>{label.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-between border-t border-border pt-2">
                                <span className="text-gray-400">Stock Total:</span>
                                <span className="font-medium text-foreground">{product.stock}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Images */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Images Card */}
                    <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
                        <h3 className="text-lg font-bold mb-4 text-foreground">Galería de Imágenes</h3>

                        {/* Add Image */}
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                placeholder="URL de la imagen (https://...)"
                                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                            />
                            <button
                                onClick={handleAddImage}
                                className="px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-stone-700 border border-border flex items-center gap-2 transition-colors"
                            >
                                <Upload size={18} /> Agregar
                            </button>
                        </div>

                        {/* Image Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Render Main Image first if no product_images yet */}
                            {(!product.product_images || product.product_images.length === 0) && product.image_url && (
                                <div className="relative group border border-border rounded-lg overflow-hidden bg-background">
                                    <img src={product.image_url} alt="Main" className="w-full h-40 object-cover" />
                                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded border border-white/10">Principal (Legacy)</div>
                                </div>
                            )}

                            {product.product_images?.sort((a, b) => a.display_order - b.display_order).map((img) => (
                                <div key={img.id} className="relative group border border-border rounded-lg overflow-hidden bg-background hover:border-primary/50 transition-colors">
                                    <img src={img.url} alt="" className="w-full h-40 object-cover" />

                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleDeleteImage(img.id)}
                                            className="p-2 bg-red-900/80 text-white rounded-full hover:bg-red-700 border border-red-500/50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-xs text-center border-t border-white/10 text-gray-300">
                                        {img.color_variant || 'Todas las variantes'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description Card (Read Only for now or Simple Edit) */}
                    <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
                        <h3 className="text-lg font-bold mb-4 text-foreground">Descripción</h3>
                        <div className="prose max-w-none text-gray-400 whitespace-pre-line">
                            {product.description || 'Sin descripción.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}