export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'x-admin-key': token } : {})
    };
};

export async function fetchProducts(search = '') {
    try {
        const res = await fetch(`${API_URL}/admin/products?search=${search}`, {
            cache: 'no-store',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error("Failed to fetch products");
        return await res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function updateProductPrice(id: string, priceOverride?: number, discountPercentage?: number) {
    try {
        const res = await fetch(`${API_URL}/admin/products/${id}/price`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ price_override: priceOverride, discount_percentage: discountPercentage })
        });
        if (!res.ok) throw new Error("Failed to update price");
        return await res.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function addProductImage(id: string, url: string, displayOrder = 0, colorVariant?: string) {
    try {
        const res = await fetch(`${API_URL}/admin/products/${id}/images`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ url, display_order: displayOrder, color_variant: colorVariant })
        });
        if (!res.ok) throw new Error("Failed to add image");
        return await res.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteImage(imageId: number) {
    try {
        const res = await fetch(`${API_URL}/admin/images/${imageId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error("Failed to delete image");
        return await res.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function reorderImage(imageId: number, newOrder: number) {
    try {
        const res = await fetch(`${API_URL}/admin/images/${imageId}/reorder`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ new_order: newOrder })
        });
        if (!res.ok) throw new Error("Failed to reorder");
        return await res.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function syncStock() {
    try {
        const res = await fetch(`${API_URL}/admin/sync-stock`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error("Failed to sync stock");
        return await res.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}
