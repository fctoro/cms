import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(request, { params }) {
  try {
    const { id: competitionId } = await params;
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    let query = supabase
      .from("flagday_categories")
      .select("*")
      .eq("competition_id", competitionId);

    if (name) {
      query = query.eq("name", name);
    }

    const { data, error } = await query.single();

    if (error) {
      // If single fails, try select without single
      const { data: list, error: listError } = await query;
      if (listError) throw listError;
      return NextResponse.json({ data: list[0] || null, success: true });
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error("Erreur [GET /api/tournaments/[id]/categories]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
