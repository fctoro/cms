import { NextResponse } from "next/server";

const db = require("@/server/db");
const { uploadToStorage } = require("@/server/storage");
const { escapeHtml, renderToroMail, sendMail } = require("@/server/mailer");

export const runtime = "nodejs";

const DOCUMENT_FIELDS = [
  { key: "document_photo_id", aliases: ["document_photo_id", "photo", "photo_id"] },
  { key: "document_birth_certificate", aliases: ["document_birth_certificate", "birth_certificate", "acte_naissance"] },
  { key: "document_parent_id", aliases: ["document_parent_id", "parent_id", "piece_parent"] },
];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function getString(formData, key, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

function getOptionalString(formData, key) {
  return getString(formData, key) || null;
}

function getJson(formData, key, fallback = null) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getBoolean(formData, key) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return false;
  }
  return ["true", "1", "on", "yes"].includes(value.toLowerCase());
}

function getDocumentFile(formData, aliases) {
  for (const alias of aliases) {
    const value = formData.get(alias);
    if (value && typeof value !== "string") {
      return value;
    }
  }
  return null;
}

function getDocumentUrl(payload, aliases) {
  for (const alias of aliases) {
    const value = payload?.[alias];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function buildPayload(registration) {
  return {
    program: registration.program,
    child_first_name: registration.child_first_name,
    child_last_name: registration.child_last_name,
    child_birth_date: registration.child_birth_date,
    child_gender: registration.child_gender,
    child_address: registration.child_address,
    child_school: registration.child_school,
    child_soccer_experience: registration.child_soccer_experience,
    guardian_name: registration.guardian_name,
    guardian_email: registration.guardian_email,
    guardian_phone: registration.guardian_phone,
    guardian_address: registration.guardian_address,
    emergency_name: registration.emergency_name,
    emergency_relation: registration.emergency_relation,
    emergency_phone: registration.emergency_phone,
    emergency_email: registration.emergency_email,
    emergency_address: registration.emergency_address,
    uniform_top_size: registration.uniform_top_size,
    uniform_short_size: registration.uniform_short_size,
    preferred_numbers: registration.preferred_numbers,
    payment_plan: registration.payment_plan,
    payment_method: registration.payment_method,
    signature_name: registration.signature_name,
    consents: registration.consents,
  };
}

async function sendRegistrationConfirmation(registration) {
  const childName = `${registration.child_first_name} ${registration.child_last_name}`.trim();
  const subject = `Confirmation d'inscription - ${childName}`;
  const text = [
    `Bonjour ${registration.guardian_name},`,
    "",
    `Nous confirmons la reception de l'inscription de ${childName} au programme ${registration.program}.`,
    "Votre dossier a bien ete enregistre et sera traite par l'equipe FC TORO.",
    "",
    "FC TORO",
  ].join("\n");

  await sendMail({
    to: registration.guardian_email,
    subject,
    text,
    html: renderToroMail({
      preheader: "Confirmation d'inscription",
      title: "VOTRE INSCRIPTION EST EN COURS.",
      intro: `Bonjour ${escapeHtml(registration.guardian_name)}, votre demande d'inscription a bien ete recue par FC TORO.`,
      lead: "Le club prepare maintenant les prochaines etapes pour accompagner votre famille dans une integration claire, serieuse et sportive.",
      bullets: [
        `Programme concerne : ${registration.program === "tiToro" ? "Ti Toro" : "FC TORO"}.`,
        "Vous recevrez bientot les informations utiles pour finaliser le paiement et valider la suite du dossier.",
        "Notre equipe reste mobilisee pour vous guider simplement, du formulaire jusqu'au terrain.",
      ],
      leftTitle: "Programmes",
      leftItems: ["Elite", "Seniors", "Ti Toro"],
      rightTitle: "Evenements",
      rightItems: ["Vertieres Cup", "Flag Day", "Intrasquad", "International"],
      closingTitle: "Suivez l'aventure",
      closingText: "Pourquoi rejoindre notre communaute ? Pour vivre l'intensite de l'energie pure FC TORO.",
    }),
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(request) {
  const client = await db.connect();

  try {
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");
    const formData = isMultipart ? await request.formData() : null;
    const jsonBody = isMultipart ? null : await request.json();

    const registrationInput = {
      program: isMultipart ? getString(formData, "program") : String(jsonBody?.program || "").trim(),
      child_first_name: isMultipart ? getString(formData, "child_first_name") : String(jsonBody?.child_first_name || "").trim(),
      child_last_name: isMultipart ? getString(formData, "child_last_name") : String(jsonBody?.child_last_name || "").trim(),
      child_birth_date: isMultipart ? getString(formData, "child_birth_date") : String(jsonBody?.child_birth_date || "").trim(),
      child_gender: isMultipart ? getString(formData, "child_gender") : String(jsonBody?.child_gender || "").trim(),
      child_address: isMultipart ? getString(formData, "child_address") : String(jsonBody?.child_address || "").trim(),
      child_school: isMultipart ? getString(formData, "child_school") : String(jsonBody?.child_school || "").trim(),
      child_soccer_experience: isMultipart ? getOptionalString(formData, "child_soccer_experience") : jsonBody?.child_soccer_experience || null,
      guardian_name: isMultipart ? getString(formData, "guardian_name") : String(jsonBody?.guardian_name || "").trim(),
      guardian_email: isMultipart ? getString(formData, "guardian_email") : String(jsonBody?.guardian_email || "").trim(),
      guardian_phone: isMultipart ? getString(formData, "guardian_phone") : String(jsonBody?.guardian_phone || "").trim(),
      guardian_address: isMultipart ? getOptionalString(formData, "guardian_address") : jsonBody?.guardian_address || null,
      emergency_name: isMultipart ? getString(formData, "emergency_name") : String(jsonBody?.emergency_name || "").trim(),
      emergency_relation: isMultipart ? getString(formData, "emergency_relation") : String(jsonBody?.emergency_relation || "").trim(),
      emergency_phone: isMultipart ? getString(formData, "emergency_phone") : String(jsonBody?.emergency_phone || "").trim(),
      emergency_email: isMultipart ? getOptionalString(formData, "emergency_email") : jsonBody?.emergency_email || null,
      emergency_address: isMultipart ? getOptionalString(formData, "emergency_address") : jsonBody?.emergency_address || null,
      uniform_top_size: isMultipart ? getString(formData, "uniform_top_size") : String(jsonBody?.uniform_top_size || "").trim(),
      uniform_short_size: isMultipart ? getString(formData, "uniform_short_size") : String(jsonBody?.uniform_short_size || "").trim(),
      preferred_numbers: isMultipart ? getOptionalString(formData, "preferred_numbers") : jsonBody?.preferred_numbers || null,
      payment_plan: isMultipart ? getString(formData, "payment_plan") : String(jsonBody?.payment_plan || "").trim(),
      payment_method: isMultipart ? getString(formData, "payment_method") : String(jsonBody?.payment_method || "").trim(),
      signature_name:
        isMultipart
          ? getString(formData, "signature_name") || getString(formData, "parent_signature")
          : String(jsonBody?.signature_name || jsonBody?.parent_signature || "").trim(),
      consents:
        (isMultipart ? getJson(formData, "consents") : jsonBody?.consents) || {
          consent_media: isMultipart ? getBoolean(formData, "consent_media") : Boolean(jsonBody?.consent_media),
          consent_health: isMultipart ? getBoolean(formData, "consent_health") : Boolean(jsonBody?.consent_health),
          consent_accuracy: isMultipart ? getBoolean(formData, "consent_accuracy") : Boolean(jsonBody?.consent_accuracy),
          consent_emergency: isMultipart ? getBoolean(formData, "consent_emergency") : Boolean(jsonBody?.consent_emergency),
        },
    };

    if (
      [
        registrationInput.program,
        registrationInput.child_first_name,
        registrationInput.child_last_name,
        registrationInput.child_birth_date,
        registrationInput.child_gender,
        registrationInput.child_address,
        registrationInput.child_school,
        registrationInput.guardian_name,
        registrationInput.guardian_email,
        registrationInput.guardian_phone,
        registrationInput.emergency_name,
        registrationInput.emergency_relation,
        registrationInput.emergency_phone,
        registrationInput.uniform_top_size,
        registrationInput.uniform_short_size,
        registrationInput.payment_plan,
        registrationInput.payment_method,
        registrationInput.signature_name,
      ].some((value) => !value)
    ) {
      return NextResponse.json(
        { error: "Les informations obligatoires de l'inscription sont manquantes." },
        { status: 400, headers: corsHeaders() },
      );
    }

    const documentEntries = DOCUMENT_FIELDS.map((definition) => ({
      ...definition,
      file: isMultipart ? getDocumentFile(formData, definition.aliases) : null,
      url: !isMultipart ? getDocumentUrl(jsonBody, definition.aliases) : null,
    }));

    if (documentEntries.some((entry) => !entry.file && !entry.url)) {
      return NextResponse.json(
        { error: "La photo du joueur, l'acte de naissance et la piece du parent sont obligatoires." },
        { status: 400, headers: corsHeaders() },
      );
    }

    await client.query("BEGIN");

    const insertRegistration = await client.query(
      `INSERT INTO player_registrations (
        program, child_first_name, child_last_name, child_birth_date, child_gender,
        child_address, child_school, child_soccer_experience,
        guardian_name, guardian_email, guardian_phone, guardian_address,
        emergency_name, emergency_relation, emergency_phone, emergency_email, emergency_address,
        uniform_top_size, uniform_short_size, preferred_numbers,
        payment_plan, payment_method, signature_name, consents
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,$12,
        $13,$14,$15,$16,$17,
        $18,$19,$20,
        $21,$22,$23,$24
      ) RETURNING *`,
      [
        registrationInput.program,
        registrationInput.child_first_name,
        registrationInput.child_last_name,
        registrationInput.child_birth_date,
        registrationInput.child_gender,
        registrationInput.child_address,
        registrationInput.child_school,
        registrationInput.child_soccer_experience,
        registrationInput.guardian_name,
        registrationInput.guardian_email,
        registrationInput.guardian_phone,
        registrationInput.guardian_address,
        registrationInput.emergency_name,
        registrationInput.emergency_relation,
        registrationInput.emergency_phone,
        registrationInput.emergency_email,
        registrationInput.emergency_address,
        registrationInput.uniform_top_size,
        registrationInput.uniform_short_size,
        registrationInput.preferred_numbers,
        registrationInput.payment_plan,
        registrationInput.payment_method,
        registrationInput.signature_name,
        JSON.stringify(registrationInput.consents || {}),
      ],
    );

    const registration = insertRegistration.rows[0];

    for (const documentEntry of documentEntries) {
      const uploaded = documentEntry.file
        ? await uploadToStorage(documentEntry.file, {
            folder: `registrations/${registration.id}`,
            kind: "image",
          })
        : null;

      await client.query(
        `INSERT INTO player_registration_documents (
          registration_id, doc_key, filename, content_type, size_bytes, path
        ) VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (registration_id, doc_key)
        DO UPDATE SET
          filename = EXCLUDED.filename,
          content_type = EXCLUDED.content_type,
          size_bytes = EXCLUDED.size_bytes,
          path = EXCLUDED.path`,
        [
          registration.id,
          documentEntry.key,
          documentEntry.file?.name || documentEntry.url.split("/").pop() || documentEntry.key,
          documentEntry.file?.type || "image/jpeg",
          documentEntry.file?.size || null,
          uploaded?.url || documentEntry.url,
        ],
      );
    }

    await client.query(
      `INSERT INTO site_messages (type, name, email, phone, message, payload, created_at, is_read)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        "joueur",
        `${registration.guardian_name} (Enfant: ${registration.child_first_name} ${registration.child_last_name})`,
        registration.guardian_email,
        registration.guardian_phone,
        `Nouvelle inscription Joueur confirmee pour le programme ${registration.program}.`,
        JSON.stringify(buildPayload(registration)),
        registration.created_at,
        false,
      ],
    );

    await client.query("COMMIT");

    try {
      await sendRegistrationConfirmation(registration);
    } catch (mailError) {
      console.error("[POST /api/inscription/joueur] email confirmation", mailError);
    }

    return NextResponse.json(
      {
        data: {
          registrationId: registration.id,
          message: "Inscription enregistree avec succes.",
        },
      },
      { status: 201, headers: corsHeaders() },
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[POST /api/inscription/joueur]", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'inscription joueur." },
      { status: 500, headers: corsHeaders() },
    );
  } finally {
    client.release();
  }
}
