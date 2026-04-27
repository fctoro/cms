import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

// GET all categories for an edition
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from("flagday_categories")
      .select("*")
      .eq("competition_id", id)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], success: true });
  } catch (error) {
    console.error("Erreur [GET /api/tournaments/[id]/categories]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des catégories" },
      { status: 500 }
    );
  }
}

// POST a new category for an edition
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Create the category
    const { data: category, error: catError } = await supabase
      .from("flagday_categories")
      .insert({
        competition_id: id,
        name: body.name, // e.g. "U15"
        sort_order: body.sort_order || 0,
        active: true
      })
      .select()
      .single();

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    return NextResponse.json({ data: category, success: true }, { status: 201 });
  } catch (error) {
    console.error("Erreur [POST /api/tournaments/[id]/categories]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la catégorie" },
      { status: 500 }
    );
  }
}
