import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ Variables d'environnement Supabase serveur manquantes. Le client ne sera pas initialisé correctement.");
}

/**
 * Client Supabase avec service role key.
 * Bypasse le RLS — à utiliser uniquement dans les API routes (serveur).
 * NE JAMAIS exposer ce client côté client/browser.
 */
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null as any; // On évite de crash au build, mais les requêtes échoueront au runtime si vide
