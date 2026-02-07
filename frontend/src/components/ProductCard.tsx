import React from 'react';

interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    image_url?: string;
    description?: string;
}

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col h-full">
            {/* Image Container */}
            <div className="relative h-64 overflow-hidden bg-gray-900">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                        <span className="text-2xl font-bold text-white tracking-tight">
                            ${product.price.toLocaleString()}
                        </span>
                    </div>

                    <button
                        className="bg-primary text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-colors shadow-md active:scale-95 z-10 relative"
                    >
                        Ver opciones
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
