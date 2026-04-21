import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const db = require("@/server/db");
export const runtime = "nodejs";

function getTokenFromRequest(request) {
  const auth = request.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret || !token) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

// ─── Ensure table exists ────────────────────────────────────────────────────
async function ensurePagesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id          BIGSERIAL PRIMARY KEY,
      title       TEXT        NOT NULL,
      slug        TEXT        NOT NULL UNIQUE,
      status      TEXT        NOT NULL DEFAULT 'draft',
      content     TEXT        NOT NULL DEFAULT '',
      meta_title  TEXT,
      meta_desc   TEXT,
      cover_image TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// ─── GET all pages ───────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    await ensurePagesTable();
    const { rows } = await db.query(
      "SELECT id, title, slug, status, meta_title, meta_desc, cover_image, created_at, updated_at FROM cms_pages ORDER BY updated_at DESC"
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[GET /api/admin/pages]", error.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ─── POST create page ────────────────────────────────────────────────────────
export async function POST(request) {
  const token = getTokenFromRequest(request);
  if (!verifyToken(token))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  try {
    await ensurePagesTable();
    const body = await request.json();
    const { title, slug, status = "draft", content = "", meta_title, meta_desc, cover_image } = body;

    if (!title || !slug)
      return NextResponse.json({ error: "Titre et slug obligatoires." }, { status: 400 });

    const { rows } = await db.query(
      `INSERT INTO cms_pages (title, slug, status, content, meta_title, meta_desc, cover_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, slug.toLowerCase().replace(/\s+/g, "-"), status, content, meta_title || null, meta_desc || null, cover_image || null]
    );
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: isDuplicate ? "Ce slug est déjà utilisé." : "Erreur serveur." },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}

// ─── PUT update page ─────────────────────────────────────────────────────────
export async function PUT(request) {
  const token = getTokenFromRequest(request);
  if (!verifyToken(token))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  try {
    await ensurePagesTable();
    const body = await request.json();
    const { id, title, slug, status, content, meta_title, meta_desc, cover_image } = body;

    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });

    const { rows } = await db.query(
      `UPDATE cms_pages
       SET title=$1, slug=$2, status=$3, content=$4, meta_title=$5, meta_desc=$6, cover_image=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [title, slug?.toLowerCase().replace(/\s+/g, "-"), status, content, meta_title || null, meta_desc || null, cover_image || null, id]
    );

    if (!rows.length)
      return NextResponse.json({ error: "Page introuvable." }, { status: 404 });

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: isDuplicate ? "Ce slug est déjà utilisé." : "Erreur serveur." },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}

// ─── DELETE page ─────────────────────────────────────────────────────────────
export async function DELETE(request) {
  const token = getTokenFromRequest(request);
  if (!verifyToken(token))
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  try {
    await ensurePagesTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });

    await db.query("DELETE FROM cms_pages WHERE id=$1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/pages]", error.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
