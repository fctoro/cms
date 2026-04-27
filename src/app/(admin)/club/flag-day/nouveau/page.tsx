"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SectionCard, cn } from "@/components/common/CmsShared";

const CATEGORIES = ["U9", "U11", "U13", "U15", "U17", "U19", "U21"];

interface Team {
  id: string;
  name: string;
  logo_url: string;
}

export default function NewTournamentWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    season: new Date().getFullYear().toString(),
    description: "",
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return setError("Le nom est obligatoire");
    
    setLoading(true);
    setError("");

    try {
      // Créer l'édition
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const tourData = await res.json();
      if (!res.ok) throw new Error(tourData.error);

      const tournamentId = tourData.data.id;
      router.push(`/club/flag-day/${tournamentId}`);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <PageBreadCrumb pageTitle="Nouvelle Édition Flag Day" />

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionCard title="Informations de l'Édition" description="Créez l'événement parent (ex: Flag Day 2026). Vous pourrez ensuite ajouter les compétitions par catégorie.">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nom de l'édition *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 text-lg font-medium focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Ex: Flag Day 2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Saison / Année</label>
                  <input 
                    type="text" 
                    value={formData.season}
                    onChange={e => setFormData({...formData, season: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 text-lg focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description (Optionnel)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Détails sur l'édition..."
                />
              </div>
            </div>
          </SectionCard>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold animate-in shake-100">
            {error}
          </div>
        )}

        <div className="mt-10">
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-5 px-8 rounded-2xl bg-brand-500 text-white font-bold hover:bg-brand-600 transition-all outline-none shadow-xl shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer l'Édition"}
            </button>
        </div>
      </div>
    </div>
  );
}
