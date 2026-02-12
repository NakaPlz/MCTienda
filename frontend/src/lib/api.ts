const IS_SERVER = typeof window === 'undefined';
// On server: Use internal Docker URL. On client: Use proxy path.
const API_URL = IS_SERVER
  ? (process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000")
  : "/api/backend";

export async function createOrder(orderData: any) {
  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error("Failed to create order");
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function fetchProducts(page = 1, limit = 9, categories?: string[], search = '', minPrice?: number, maxPrice?: number) {
  try {
    const skip = (page - 1) * limit;
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });

    if (categories && categories.length > 0) {
      categories.forEach(cat => queryParams.append('category', cat));
    }
    if (search) queryParams.append('search', search);
    if (minPrice !== undefined) queryParams.append('min_price', minPrice.toString());
    if (maxPrice !== undefined) queryParams.append('max_price', maxPrice.toString());

    const res = await fetch(`${API_URL}/products?${queryParams.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { items: [], total: 0, page: 1, limit: limit }; // Return safe empty/mock object structure
  }
}

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/products/categories`, { cache: 'no-store' }); // Disable cache for now
    if (!res.ok) throw new Error("Failed to fetch categories");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function fetchConfig() {
  try {
    const res = await fetch(`${API_URL}/config`, { next: { revalidate: 300 } }); // Cache for 5 mins
    if (!res.ok) throw new Error("Failed to fetch config");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { free_shipping_threshold: 55000 }; // Fallback
  }
}

export async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch product");
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function createCustomer(data: any) {
  try {
    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create customer");
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function calculateShipping(orderData: any) {
  try {
    const res = await fetch(`${API_URL}/shipping/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error("Failed to calculate shipping");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { cost: 0, message: "Error calculating" };
  }
}

export async function getOrder(orderId: number, paymentId?: string) {
  try {
    const url = paymentId
      ? `${API_URL}/orders/${orderId}?payment_id=${paymentId}`
      : `${API_URL}/orders/${orderId}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch order");
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function trackOrder(orderId: number, email: string) {
  try {
    const res = await fetch(`${API_URL}/orders/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId, email })
    });
    if (!res.ok) throw new Error("Order not found or details incorrect");
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function confirmPayment(orderId: number, paymentId: string) {
  try {
    const res = await fetch(`${API_URL}/orders/${orderId}/confirm?payment_id=${paymentId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error("Failed to confirm payment");
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
