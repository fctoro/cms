import { NextResponse } from "next/server";

const db = require("@/server/db");
const { requireAuth } = require("@/server/auth");

export const runtime = "nodejs";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeStatus(value) {
  if (value === "published" || value === "review" || value === "archived" || value === "draft") {
    return value;
  }
  if (value === "publie") return "published";
  if (value === "revision") return "review";
  if (value === "archive") return "archived";
  return "draft";
}

function mapStageInput(body) {
  return {
    title: body.titre || body.title,
    excerpt: body.extrait || body.excerpt || "",
    content: body.contenu || body.content || "",
    cover_image: body.photo_couverture || body.coverImage || body.cover_image || "/images/grid-image/image-01.png",
    department: body.departement || body.department || "Communication",
    location: body.location || "",
    work_mode: body.work_mode || body.workMode || "hybrid",
    duration: body.duration || "",
    contact_email: body.contact_email || body.contactEmail || "",
    close_date: body.close_date || body.closeDate || null,
    supervisor: body.supervisor || "",
    start_date: body.start_date || body.startDate || null,
    stage_type: body.stage_type || body.stageType || "",
    main_group: body.main_group || body.mainGroup || "",
    languages: body.languages || "",
    about_club: body.about_club || body.aboutClub || "",
    about_mission: body.about_mission || body.aboutMission || "",
    responsibilities: body.responsibilities || "",
    club_life: body.club_life || body.clubLife || "",
    profile_searched: body.profile_searched || body.profileSearched || "",
    category: body.category || "",
    engagement: body.engagement || "",
    featured: Boolean(body.featured),
    status: normalizeStatus(body.statut || body.status),
    slug: body.slug || slugify(body.titre || body.title),
    published_at: body.date_publication || body.publishedAt || body.published_at || null,
  };
}

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { rows } = await db.query("SELECT * FROM stages ORDER BY created_at DESC");
    return NextResponse.json({ data: rows });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const body = mapStageInput(await request.json());

  try {
    const { rows } = await db.query(
      `INSERT INTO stages
       (title, excerpt, content, cover_image, department, location, work_mode, duration,
        contact_email, close_date, supervisor, start_date, stage_type, main_group, languages,
        about_club, about_mission, responsibilities, club_life, profile_searched, category, engagement,
        featured, status, slug, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
       RETURNING *`,
      [
        body.title,
        body.excerpt,
        body.content,
        body.cover_image,
        body.department,
        body.location,
        body.work_mode,
        body.duration,
        body.contact_email,
        body.close_date,
        body.supervisor,
        body.start_date,
        body.stage_type,
        body.main_group,
        body.languages,
        body.about_club,
        body.about_mission,
        body.responsibilities,
        body.club_life,
        body.profile_searched,
        body.category,
        body.engagement,
        body.featured,
        body.status,
        body.slug,
        body.published_at,
      ],
    );
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === "development" ? err.message : "Erreur serveur.",
      },
      { status: 500 },
    );
  }
}
