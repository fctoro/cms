import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const db = require("@/server/db");
export const runtime = "nodejs";

function getToken(request) {
  const auth = request.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret || !token) return null;
  try { return jwt.verify(token, secret); } catch { return null; }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id          BIGSERIAL PRIMARY KEY,
      badge       TEXT        NOT NULL DEFAULT '',
      title       TEXT        NOT NULL DEFAULT '',
      subtitle    TEXT        NOT NULL DEFAULT '',
      btn_label   TEXT        NOT NULL DEFAULT '',
      btn_url     TEXT        NOT NULL DEFAULT '#',
      image_url   TEXT        NOT NULL DEFAULT '',
      sort_order  INTEGER     NOT NULL DEFAULT 0,
      is_active   BOOLEAN     NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function GET() {
  try {
    await ensureTable();
    const { rows } = await db.query(
      "SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC"
    );
    return NextResponse.json({ data: rows }, { headers: corsHeaders() });
  } catch (e) {
    console.error("[GET /api/admin/slides]", e.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!verifyToken(getToken(request)))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    await ensureTable();
    const { badge = "", title, subtitle = "", btn_label = "", btn_url = "#", image_url = "", sort_order = 0, is_active = true } = await request.json();
    if (!title) return NextResponse.json({ error: "Le titre est obligatoire." }, { status: 400 });
    const { rows } = await db.query(
      `INSERT INTO hero_slides (badge, title, subtitle, btn_label, btn_url, image_url, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [badge, title, subtitle, btn_label, btn_url, image_url, sort_order, is_active]
    );
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/slides]", e.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!verifyToken(getToken(request)))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    await ensureTable();
    const { id, badge, title, subtitle, btn_label, btn_url, image_url, sort_order, is_active } = await request.json();
    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    const { rows } = await db.query(
      `UPDATE hero_slides SET badge=$1, title=$2, subtitle=$3, btn_label=$4, btn_url=$5, image_url=$6, sort_order=$7, is_active=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [badge, title, subtitle, btn_label, btn_url, image_url, sort_order, is_active, id]
    );
    if (!rows.length) return NextResponse.json({ error: "Slide introuvable." }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e) {
    console.error("[PUT /api/admin/slides]", e.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!verifyToken(getToken(request)))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    await db.query("DELETE FROM hero_slides WHERE id=$1", [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/admin/slides]", e.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
