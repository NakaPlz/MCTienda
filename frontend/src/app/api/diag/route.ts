import { NextResponse } from 'next/server';

export async function GET() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

    let connectivityTest = { status: "pending", message: "", url: backendUrl };
    try {
        const res = await fetch(`${backendUrl}/products?limit=1`, {
            timeout: 3000 // 3s timeout
        } as any);
        connectivityTest = {
            status: res.ok ? "success" : "error",
            message: `Status: ${res.status}`,
            url: backendUrl
        };
    } catch (e: any) {
        connectivityTest = {
            status: "failed",
            message: e.message || String(e),
            url: backendUrl
        };
    }

    return NextResponse.json({
        env: {
            BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL || "(undefined)",
            NODE_ENV: process.env.NODE_ENV,
        },
        message: "Connectivity Check",
        connectivity: connectivityTest,
        timestamp: new Date().toISOString()
    });
}
