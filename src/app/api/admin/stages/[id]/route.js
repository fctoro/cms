import { NextResponse } from "next/server";

const db = require("@/server/db");
const { requireAuth } = require("@/server/auth");

export const runtime = "nodejs";

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
    cover_image: body.photo_couverture || body.coverImage || body.cover_image,
    department: body.departement || body.department,
    location: body.location,
    work_mode: body.work_mode || body.workMode,
    duration: body.duration,
    contact_email: body.contact_email || body.contactEmail,
    close_date: body.close_date || body.closeDate || null,
    supervisor: body.supervisor,
    start_date: body.start_date || body.startDate || null,
    stage_type: body.stage_type || body.stageType,
    main_group: body.main_group || body.mainGroup,
    languages: body.languages,
    about_club: body.about_club || body.aboutClub,
    about_mission: body.about_mission || body.aboutMission,
    responsibilities: body.responsibilities,
    club_life: body.club_life || body.clubLife,
    profile_searched: body.profile_searched || body.profileSearched,
    category: body.category,
    engagement: body.engagement,
    featured: typeof body.featured === "boolean" ? body.featured : undefined,
    status: body.statut || body.status ? normalizeStatus(body.statut || body.status) : undefined,
    slug: body.slug,
    published_at: body.date_publication || body.publishedAt || body.published_at || null,
  };
}

export async function PUT(request, { params }) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  const body = mapStageInput(await request.json());

  try {
    const { rows } = await db.query(
      `UPDATE stages SET
       title = COALESCE($1, title),
       excerpt = COALESCE($2, excerpt),
       content = COALESCE($3, content),
       cover_image = COALESCE($4, cover_image),
       department = COALESCE($5, department),
       location = COALESCE($6, location),
       work_mode = COALESCE($7, work_mode),
       duration = COALESCE($8, duration),
       contact_email = COALESCE($9, contact_email),
       close_date = COALESCE($10, close_date),
       supervisor = COALESCE($11, supervisor),
       start_date = COALESCE($12, start_date),
       stage_type = COALESCE($13, stage_type),
       main_group = COALESCE($14, main_group),
       languages = COALESCE($15, languages),
       about_club = COALESCE($16, about_club),
       about_mission = COALESCE($17, about_mission),
       responsibilities = COALESCE($18, responsibilities),
       club_life = COALESCE($19, club_life),
       profile_searched = COALESCE($20, profile_searched),
       category = COALESCE($21, category),
       engagement = COALESCE($22, engagement),
       featured = COALESCE($23, featured),
       status = COALESCE($24, status),
       slug = COALESCE($25, slug),
       published_at = COALESCE($26, published_at),
       updated_at = NOW()
       WHERE id = $27
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
        id,
      ],
    );
    if (!rows.length) return NextResponse.json({ error: "Stage introuvable." }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { rowCount } = await db.query("DELETE FROM stages WHERE id = $1", [id]);
    if (!rowCount) return NextResponse.json({ error: "Stage introuvable." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
