import { NextResponse } from "next/server";

const db = require("@/server/db");
const { escapeHtml, renderSimpleMail, renderToroMail, sendMail } = require("@/server/mailer");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { to, toName, subject, replyMessage, messageId } = await request.json();

    if (!to || !subject || !replyMessage) {
      return NextResponse.json(
        { error: "Destinataire, sujet et message sont obligatoires." },
        { status: 400 },
      );
    }

    const safeName = toName || to;
    const lines = replyMessage
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    let messageType = null;

    if (messageId) {
      try {
        const { rows } = await db.query("SELECT type FROM site_messages WHERE id = $1", [messageId]);
        messageType = rows[0]?.type || null;
      } catch (typeErr) {
        console.error("[send-reply:type]", typeErr.message);
      }
    }

    await sendMail({
      to,
      subject,
      text: replyMessage,
      html:
        messageType === "joueur"
          ? renderSimpleMail({
              greeting: `Bonjour ${safeName}`,
              subject,
              message: replyMessage,
            })
          : renderToroMail({
              preheader: "Reponse de FC TORO",
              title: subject.toUpperCase(),
              intro: `Bonjour ${escapeHtml(safeName)}, FC TORO vous transmet cette reponse concernant votre dossier.`,
              lead: "Veuillez lire attentivement le message ci-dessous pour connaitre la suite a donner a votre demande.",
              bullets: lines,
              leftTitle: "Programmes",
              leftItems: ["Elite", "Seniors", "Ti Toro"],
              rightTitle: "Evenements",
              rightItems: ["Vertieres Cup", "Flag Day", "Intrasquad", "International"],
              closingTitle: "Restez connecte",
              closingText: "Pour toute question complementaire, repondez simplement a cet email ou contactez FC TORO.",
            }),
    });

    if (messageId) {
      try {
        const { rows } = await db.query("SELECT payload FROM site_messages WHERE id = $1", [messageId]);
        if (rows.length > 0) {
          let currentPayload = rows[0].payload || {};
          if (typeof currentPayload === "string") {
            try {
              currentPayload = JSON.parse(currentPayload);
            } catch {
              currentPayload = {};
            }
          }

          if (!currentPayload.replies) {
            currentPayload.replies = [];
          }

          currentPayload.replies.push({
            role: "admin",
            message: replyMessage,
            subject,
            timestamp: new Date().toISOString(),
          });

          await db.query("UPDATE site_messages SET payload = $1 WHERE id = $2", [
            JSON.stringify(currentPayload),
            messageId,
          ]);
        }
      } catch (dbErr) {
        console.error("[DB History Error]", dbErr.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-reply]", err.message);
    return NextResponse.json(
      { error: "Impossible d'envoyer la reponse." },
      { status: 500 },
    );
  }
}
