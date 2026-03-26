/**
 * GET /api/test-frontend — Quick test to check Backend→Frontend API connectivity
 * Tests that the API key is accepted and Supabase connection works
 */

import { NextResponse } from "next/server";

const FRONTEND_URL =
  process.env.DIGITAL_HOME_URL || "http://localhost:3000";
const API_KEY = process.env.API_SECRET_KEY || "";

export async function GET() {
  try {
    const res = await fetch(`${FRONTEND_URL}/api/content?status=published&limit=1`, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });

    const body = await res.text();

    return NextResponse.json({
      frontend_url: FRONTEND_URL,
      status: res.status,
      statusText: res.statusText,
      api_key_set: !!API_KEY,
      api_key_preview: API_KEY ? `${API_KEY.slice(0, 4)}...${API_KEY.slice(-4)}` : "NOT SET",
      response_preview: body.slice(0, 500),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      frontend_url: FRONTEND_URL,
      api_key_set: !!API_KEY,
    }, { status: 500 });
  }
}
