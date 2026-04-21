const nodemailer = require("nodemailer");

let cachedTransporter = null;

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return fallback;
}

function getMailerConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = toBoolean(process.env.SMTP_SECURE, port === 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromAddress = process.env.SMTP_FROM || user;
  const fromName = process.env.SMTP_FROM_NAME || "FC TORO";

  if (!host || !user || !pass || !fromAddress) {
    throw new Error("SMTP configuration is incomplete.");
  }

  return {
    transport: {
      host,
      port,
      secure,
      auth: { user, pass },
    },
    from: `${fromName} <${fromAddress}>`,
  };
}

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport(getMailerConfig().transport);
  }

  return cachedTransporter;
}

async function sendMail({ to, subject, text, html, replyTo }) {
  return getTransporter().sendMail({
    from: getMailerConfig().from,
    to,
    subject,
    text,
    html,
    replyTo,
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLogoUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.BASE_URL ||
    "";

  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/images/logo/fc-toro.png` : "";
}

function renderToroMail({
  preheader,
  title,
  intro,
  lead,
  bullets = [],
  leftTitle,
  leftItems = [],
  rightTitle,
  rightItems = [],
  closingTitle = "Suivez l'aventure",
  closingText = "Pour vivre l'intensite de l'energie pure FC TORO.",
}) {
  const logoUrl = buildLogoUrl();
  const bulletsHtml = bullets
    .map(
      (item) =>
        `<div style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#ffffff;">• ${escapeHtml(
          item,
        )}</div>`,
    )
    .join("");

  const renderList = (items) =>
    items
      .map(
        (item) =>
          `<div style="margin:0 0 8px 0;font-size:15px;font-weight:800;color:#ffffff;">${escapeHtml(
            item,
          )} <span style="color:#ef233c;">→</span></div>`,
      )
      .join("");

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#0a1224;font-family:Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a1224;padding:20px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#0a1224;">
                <tr>
                  <td style="padding:18px 24px 8px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="left">
                          ${
                            logoUrl
                              ? `<img src="${logoUrl}" alt="FC TORO" width="60" height="60" style="display:block;width:60px;height:60px;border:0;" />`
                              : `<div style="width:60px;height:60px;border-radius:999px;background:#ef233c;color:#fff;font-weight:900;text-align:center;line-height:60px;">FC</div>`
                          }
                        </td>
                        <td align="right" style="font-size:9px;letter-spacing:0.35em;font-weight:800;color:#8ea0c6;text-transform:uppercase;">
                          MACHE SOU YO
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 24px 24px 24px;">
                    <div style="font-size:10px;letter-spacing:0.35em;font-weight:900;color:#ef233c;text-transform:uppercase;margin-bottom:16px;">${escapeHtml(
                      preheader,
                    )}</div>
                    <div style="font-size:46px;line-height:0.92;font-weight:900;color:#ffffff;text-transform:uppercase;margin:0 0 24px 0;">
                      ${escapeHtml(title)}
                    </div>
                    <div style="font-size:15px;line-height:1.7;color:#d7e0f4;margin:0 0 18px 0;">${intro}</div>
                    <div style="font-size:18px;line-height:1.5;font-weight:800;color:#ffffff;margin:0 0 26px 0;">${lead}</div>
                    ${bulletsHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 24px 28px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td valign="top" width="50%" style="padding-right:12px;">
                          <div style="font-size:10px;letter-spacing:0.28em;font-weight:900;color:#ef233c;text-transform:uppercase;margin-bottom:14px;">${escapeHtml(
                            leftTitle,
                          )}</div>
                          ${renderList(leftItems)}
                        </td>
                        <td valign="top" width="50%" style="padding-left:12px;">
                          <div style="font-size:10px;letter-spacing:0.28em;font-weight:900;color:#ef233c;text-transform:uppercase;margin-bottom:14px;">${escapeHtml(
                            rightTitle,
                          )}</div>
                          ${renderList(rightItems)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:6px 24px 24px 24px;">
                    <div style="font-size:22px;font-weight:900;color:#ffffff;margin-bottom:8px;">${escapeHtml(
                      closingTitle,
                    )}</div>
                    <div style="font-size:12px;line-height:1.7;color:#8ea0c6;">${escapeHtml(
                      closingText,
                    )}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 24px 18px 24px;">
                    <div style="border-top:1px solid #24304f;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 24px 24px;font-size:11px;line-height:1.7;color:#8ea0c6;">
                    Cet e-mail confirme uniquement la bonne reception de votre demande. Les prochaines instructions vous seront transmises par le club.
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 30px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="left" style="font-size:11px;color:#ffffff;font-weight:800;">FC TORO | MACHE SOU YO</td>
                        <td align="right" style="font-size:11px;color:#8ea0c6;">© 2026 Piton Club TORO.</td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size:9px;color:#8ea0c6;padding-top:6px;">7 Rue Rigaud, Petion-Ville, Haiti</td>
                        <td></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function renderSimpleMail({ greeting, subject, message, signature = "FC TORO" }) {
  const safeGreeting = greeting ? `${escapeHtml(greeting)},` : "Bonjour,";
  const paragraphs = String(message || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px 0;">${escapeHtml(line)}</p>`)
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:640px;margin:0 auto;font-size:14px;line-height:1.6;">
          <p style="margin:0 0 12px 0;"><strong>Objet :</strong> ${escapeHtml(subject)}</p>
          <p style="margin:0 0 16px 0;">${safeGreeting}</p>
          ${paragraphs}
          <p style="margin:20px 0 0 0;">Cordialement,<br />${escapeHtml(signature)}</p>
        </div>
      </body>
    </html>
  `;
}

module.exports = {
  escapeHtml,
  renderSimpleMail,
  renderToroMail,
  sendMail,
};
