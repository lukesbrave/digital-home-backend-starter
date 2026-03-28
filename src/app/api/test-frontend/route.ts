/**
 * GET /api/test-frontend — Quick test to check Backend→Frontend API connectivity
 * Tests that the API key is accepted and Supabase connection works
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateSession, unauthorizedResponse } from "@/lib/api/auth";

const FRONTEND_URL =
  process.env.DIGITAL_HOME_URL || "http://localhost:3000";
const API_KEY = process.env.API_SECRET_KEY || "";

export async function GET(request: NextRequest) {
  const auth = await authenticateSession(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

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
