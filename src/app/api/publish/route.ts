/**
 * POST /api/publish — Publish a draft article
 *
 * Accepts { calendar_entry_id } and:
 * 1. Looks up the calendar entry to find the linked content_object_id
 * 2. Updates content_objects status to "published" + sets published_at
 * 3. Updates content_calendar status to "published"
 * 4. Returns the updated content object
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";


export async function POST(request: NextRequest) {
  const body = await request.json();
  const { calendar_entry_id } = body;

  if (!calendar_entry_id) {
    return NextResponse.json(
      { error: "calendar_entry_id is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // 1. Fetch the calendar entry
  const { data: calendarEntry, error: calendarError } = await supabase
    .from("content_calendar")
    .select("*")
    .eq("id", calendar_entry_id)
    .single();

  if (calendarError || !calendarEntry) {
    return NextResponse.json(
      { error: "Calendar entry not found" },
      { status: 404 }
    );
  }

  if (!calendarEntry.content_object_id) {
    return NextResponse.json(
      { error: "No article written for this entry yet. The article must be drafted before publishing." },
      { status: 400 }
    );
  }

  // 2. Update the content object to published
  const { data: contentObject, error: contentError } = await supabase
    .from("content_objects")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", calendarEntry.content_object_id)
    .select("*")
    .single();

  if (contentError || !contentObject) {
    return NextResponse.json(
      { error: `Failed to publish article: ${contentError?.message || "not found"}` },
      { status: 500 }
    );
  }

  // 3. Update the calendar entry status
  await supabase
    .from("content_calendar")
    .update({ status: "published" })
    .eq("id", calendar_entry_id);

  return NextResponse.json({
    success: true,
    article: contentObject,
  });
}
