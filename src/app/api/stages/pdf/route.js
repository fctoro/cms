import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const db = require("@/server/db");

export const runtime = "nodejs";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant." }, { status: 400 });
    }

    const { rows } = await db.query("SELECT * FROM stages WHERE id = $1 LIMIT 1", [id]);
    if (!rows.length) {
      return NextResponse.json({ error: "Recrutement introuvable." }, { status: 404 });
    }

    const stage = rows[0];
    const pdfDoc = await PDFDocument.create();
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawText("FC TORO - FICHE RECRUTEMENT", {
      x: 40,
      y: height - 50,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.3),
    });

    page.drawText(stage.title || "Sans titre", {
      x: 40,
      y: height - 85,
      size: 15,
      font: boldFont,
      color: rgb(0.8, 0.1, 0.1),
    });

    const fields = [
      ["Departement", stage.department],
      ["Lieu", stage.location],
      ["Mode", stage.work_mode],
      ["Type", stage.stage_type],
      ["Duree", stage.duration],
      ["Superviseur", stage.supervisor],
      ["Email contact", stage.contact_email],
      ["Debut", formatDate(stage.start_date)],
      ["Cloture", formatDate(stage.close_date)],
      ["Statut", stage.status],
      ["Candidatures", String(stage.applications ?? 0)],
      ["Vues", String(stage.views ?? 0)],
      ["Contacts", String(stage.contact_clicks ?? 0)],
    ];

    let y = height - 125;
    for (const [label, value] of fields) {
      page.drawText(`${label}:`, {
        x: 40,
        y,
        size: 11,
        font: boldFont,
        color: rgb(0.25, 0.25, 0.25),
      });
      page.drawText(String(value || "-"), {
        x: 150,
        y,
        size: 11,
        font: regularFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 22;
    }

    page.drawText("Resume", {
      x: 40,
      y: y - 10,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.3),
    });

    const excerpt = String(stage.excerpt || "-");
    const words = excerpt.split(/\s+/);
    let line = "";
    let textY = y - 35;

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > 85) {
        page.drawText(line, {
          x: 40,
          y: textY,
          size: 10,
          font: regularFont,
          color: rgb(0.15, 0.15, 0.15),
        });
        line = word;
        textY -= 16;
      } else {
        line = candidate;
      }
    }

    if (line) {
      page.drawText(line, {
        x: 40,
        y: textY,
        size: 10,
        font: regularFont,
        color: rgb(0.15, 0.15, 0.15),
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Recrutement_${String(stage.slug || stage.id)}.pdf`,
      },
    });
  } catch (error) {
    console.error("[GET /api/stages/pdf]", error.message);
    return NextResponse.json({ error: "Erreur generation PDF." }, { status: 500 });
  }
}
