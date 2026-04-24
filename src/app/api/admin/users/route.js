import { NextResponse } from "next/server";

const bcrypt = require("bcrypt");
const db = require("@/server/db");
const { requireAuth, requireSuperAdmin } = require("@/server/auth");

export const runtime = "nodejs";

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const forbidden = requireSuperAdmin(auth.user);
  if (forbidden) return forbidden;
  try {
    const { rows } = await db.query("SELECT id, name, email, role, title, avatar, bio, active, created_at, updated_at FROM admin_users ORDER BY created_at DESC");
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error(`[GET /api/admin/users]`, err.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const forbidden = requireSuperAdmin(auth.user);
  if (forbidden) return forbidden;
  const body = await request.json();
  const email = body.email ? body.email.trim() : "";
  const password = body.password ? body.password.trim() : "";
  
  if (!email || !password) {
     return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre." },
      { status: 400 }
    );
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO admin_users
       (name, email, password_hash, role, title, avatar, bio, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, name, email, role, title, avatar, bio, active, created_at`,
      [
        body.nom || body.name,
        email,
        hash,
        body.role || "moderator",
        body.title || "",
        body.avatar || "/images/user/owner.jpg",
        body.bio || "",
        body.actif ?? body.active ?? true,
      ],
    );
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/users] Error:", err.message);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
