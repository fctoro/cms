import { NextResponse } from "next/server";
const db = require("@/server/db");

export const runtime = "nodejs";

export async function GET(request) {
  const { requireAuth } = require("@/server/auth");
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  try {
    // 1. Home stats
    const homeRes = await db.query("SELECT visits, cta_clicks FROM home_page_settings WHERE id = true");
    const homeStats = homeRes.rows[0] || { visits: 0, cta_clicks: 0 };

    // 2. Most read articles
    const articlesRes = await db.query("SELECT id, title_fr as title, views, link_clicks FROM articles ORDER BY views DESC LIMIT 5");
    const topArticles = articlesRes.rows;

    // 3. Most viewed stages
    const stagesRes = await db.query("SELECT id, title, views, applications, contact_clicks FROM stages ORDER BY views DESC LIMIT 5");
    const topStages = stagesRes.rows;

    // 4. Partner clicks
    const partnersRes = await db.query("SELECT id, name, clicks FROM partners ORDER BY clicks DESC LIMIT 5");
    const topPartners = partnersRes.rows;

    return NextResponse.json({
      data: {
        overall: {
          totalVisits: homeStats.visits,
          totalCtaClicks: homeStats.cta_clicks,
        },
        articles: topArticles,
        stages: topStages,
        partners: topPartners
      },
      success: true
    });
  } catch (err) {
    console.error("[GET /api/admin/tracking/stats]", err.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
