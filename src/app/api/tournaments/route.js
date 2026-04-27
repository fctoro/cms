import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("flagday_competitions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], success: true });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tournois" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { requireAuth } = require("@/server/auth");
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("flagday_competitions")
      .insert([
        {
          name: body.name,
          slug: body.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
          season: body.season || new Date().getFullYear().toString(),
          description: body.description || "",
          age_category: "GLOBAL", // Default to GLOBAL for the edition
          status: "preparation",
          is_published: false,
          active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Une édition avec ce nom existe déjà." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'édition" },
      { status: 500 }
    );
  }
}
