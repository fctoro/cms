"use client";

import PublicSiteShell from "@/components/common/PublicSiteShell";
import { mapDbStage } from "@/lib/cms-admin-client";
import { CmsStage } from "@/types/cms";
import { useEffect, useState } from "react";

function formatDate(value: string | null) {
  if (!value) return "A definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function RecrutementPage() {
  const [stages, setStages] = useState<CmsStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/stages", { cache: "no-store" });
        const json = await res.json();
        setStages(Array.isArray(json.data) ? json.data.map(mapDbStage) : []);
      } catch (error) {
        console.error("[RecrutementPage]", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <PublicSiteShell>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
            Recrutement
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Offres ouvertes</h1>
          <p className="mt-4 text-base leading-8 text-gray-300">
            Retrouvez ici tous les recrutements publiés depuis le CMS. Chaque nouvel enregistrement
            publié dans l'onglet recrutement apparaît automatiquement sur cette page.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-gray-300">
              Chargement des recrutements...
            </div>
          ) : stages.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-gray-300">
              Aucun recrutement publié pour le moment.
            </div>
          ) : (
            stages.map((stage) => (
              <article
                key={stage.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/10"
              >
                <img
                  src={stage.coverImage || "/images/grid-image/image-01.png"}
                  alt={stage.title}
                  className="h-48 w-full object-cover"
                />
                <div className="space-y-4 p-6">
                  <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      {stage.department}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      {stage.workMode}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{stage.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-gray-300">{stage.excerpt}</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Lieu: {stage.location || "-"}</p>
                    <p>Type: {stage.stageType || stage.duration || "-"}</p>
                    <p>Cloture: {formatDate(stage.closeDate)}</p>
                  </div>
                  <a
                    href={`mailto:${stage.contactEmail}?subject=Candidature ${stage.title}`}
                    className="inline-flex rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                  >
                    Postuler
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </PublicSiteShell>
  );
}
