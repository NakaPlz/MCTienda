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

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
  } catch (error) {
    console.error(error);
    return []; // Return empty array on error for now
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

export async function getOrder(orderId: number) {
  try {
    const res = await fetch(`${API_URL}/orders/${orderId}`);
    if (!res.ok) throw new Error("Failed to fetch order");
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
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
