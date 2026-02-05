import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        env: {
            BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL || "(undefined)",
            NODE_ENV: process.env.NODE_ENV,
        },
        configCheck: {
            isSet: !!process.env.BACKEND_INTERNAL_URL
        },
        message: "Diagnosis check",
        timestamp: new Date().toISOString()
    });
}
