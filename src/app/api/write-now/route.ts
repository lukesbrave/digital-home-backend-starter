/**
 * POST /api/write-now — Trigger AI article writing for an approved topic
 *
 * Calls /api/write-article which handles the full flow:
 * marks as writing → calls Claude → saves article → updates calendar
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { calendar_entry_id } = body;

  if (!calendar_entry_id) {
    return NextResponse.json(
      { error: "calendar_entry_id is required" },
      { status: 400 }
    );
  }

  // Proxy to the write-article endpoint which handles everything
  const baseUrl = request.nextUrl.origin;
  const res = await fetch(`${baseUrl}/api/write-article`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calendar_entry_id }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
