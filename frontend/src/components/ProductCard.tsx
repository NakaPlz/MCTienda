import Image from 'next/image';

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
    labels?: Label[];
    price_override?: number | null;
    discount_percentage?: number;
}

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const hasStock = product.stock > 0;

    // --- Price Logic ---
    const originalPrice = product.price;
    const hasOverride = product.price_override !== null && product.price_override !== undefined;
    const hasDiscount = (product.discount_percentage ?? 0) > 0;

    let finalPrice = originalPrice;
    if (hasOverride) {
        finalPrice = product.price_override!;
    } else if (hasDiscount) {
        finalPrice = originalPrice * (1 - (product.discount_percentage! / 100));
    }

    const isDiscounted = hasOverride
        ? finalPrice < originalPrice
        : hasDiscount;

    return (
        <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col h-full relative">
            {/* Image Container */}
            <div className="relative h-64 overflow-hidden bg-gray-900">
                {/* Badges Overlay */}
                <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start">
                    {!hasStock && (
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                            SIN STOCK
                        </span>
                    )}
                    {isDiscounted && (
                        <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                            {hasDiscount ? `-${product.discount_percentage}%` : 'OFERTA'}
                        </span>
                    )}
                    {product.labels && product.labels.map(label => (
                        <span
                            key={label.id}
                            className="text-white text-xs font-bold px-2 py-1 rounded shadow-sm"
                            style={{ backgroundColor: label.color }}
                        >
                            {label.name}
                        </span>
                    ))}
                </div>

                {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!hasStock ? 'grayscale opacity-70' : ''}`}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-600 font-light">
                        Sin Imagen
                    </div>
                )}
                {/* Overlay gradient only visible on hover (optional) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="mb-4">
                    <h3 className="text-xl font-heading text-white leading-tight font-medium line-clamp-2" title={product.name}>
                        {product.name}
                    </h3>
                </div>

                <div className="mt-auto flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-light">Precio</span>
                        {isDiscounted && (
                            <span className="text-sm text-gray-500 line-through">
                                ${originalPrice.toLocaleString()}
                            </span>
                        )}
                        <span className={`text-2xl font-bold tracking-tight ${isDiscounted ? 'text-green-400' : 'text-white'}`}>
                            ${Math.round(finalPrice).toLocaleString()}
                        </span>
                    </div>

                    <button
                        disabled={!hasStock}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors shadow-md active:scale-95 z-10 relative ${hasStock ? 'bg-primary text-black hover:bg-yellow-500' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                    >
                        {hasStock ? 'Ver opciones' : 'Agotado'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
