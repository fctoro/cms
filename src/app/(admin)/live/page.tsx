"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SectionCard } from "@/components/common/CmsShared";
import Button from "@/components/ui/button/Button";
import Loader from "@/components/common/Loader";
import Image from "next/image";

type Team = {
  id: string;
  name: string;
  logo_url: string;
};

export default function LivePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [formData, setFormData] = useState({
    title: "FC TORO Live",
    event_date: new Date().toISOString().slice(0, 16),
    location: "Stade FC TORO",
    youtube_url: "",
    home_team_id: "",
    away_team_id: "",
    home_score: "",
    away_score: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch teams
        const teamsRes = await fetch("/api/tournaments/global-teams");
        if (teamsRes.ok) {
          const { data } = await teamsRes.json();
          setTeams(data || []);
        }

        // Fetch current live event
        const liveRes = await fetch("/api/live");
        if (liveRes.ok) {
          const { data } = await liveRes.json();
          if (data) {
            setFormData({
              title: data.title || "FC TORO Live",
              event_date: data.event_date ? new Date(data.event_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
              location: data.location || "Stade FC TORO",
              youtube_url: data.youtube_url || "",
              home_team_id: data.home_team_id || "",
              away_team_id: data.away_team_id || "",
              home_score: data.home_score !== null ? String(data.home_score) : "",
              away_score: data.away_score !== null ? String(data.away_score) : "",
            });
          }
        }
      } catch (e) {
        console.error("Erreur de chargement", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Le match en direct a été mis à jour avec succès.");
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const homeTeam = teams.find(t => t.id === formData.home_team_id);
  const awayTeam = teams.find(t => t.id === formData.away_team_id);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center space-x-2">
        <Loader />
        <span>Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Match en Direct" />
      
      <SectionCard 
        title="Gestion du Match en Direct" 
        description="Configurez les détails du match diffusé sur la page Live du site."
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
          </Button>
        }
      >
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Titre de l'événement</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Ex: FC TORO Live"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date et heure</label>
              <input
                type="datetime-local"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">URL YouTube (Si vide, le bouton Live restera gris sur le site)</label>
            <input
              type="text"
              name="youtube_url"
              value={formData.youtube_url}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Ex: https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            {/* Equipe Domicile */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-center">Équipe Domicile</h3>
              {homeTeam ? (
                <div className="flex justify-center">
                  <Image src={homeTeam.logo_url} alt={homeTeam.name} width={80} height={80} className="object-contain" />
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500">Logo</div>
                </div>
              )}
              <select
                name="home_team_id"
                value={formData.home_team_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Sélectionner une équipe...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Score Domicile</label>
                <input
                  type="number"
                  name="home_score"
                  value={formData.home_score}
                  onChange={handleChange}
                  placeholder="Score"
                  className="w-full text-center text-2xl font-bold rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Equipe Visiteur */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-center">Équipe Visiteur</h3>
              {awayTeam ? (
                <div className="flex justify-center">
                  <Image src={awayTeam.logo_url} alt={awayTeam.name} width={80} height={80} className="object-contain" />
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500">Logo</div>
                </div>
              )}
              <select
                name="away_team_id"
                value={formData.away_team_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Sélectionner une équipe...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Score Visiteur</label>
                <input
                  type="number"
                  name="away_score"
                  value={formData.away_score}
                  onChange={handleChange}
                  placeholder="Score"
                  className="w-full text-center text-2xl font-bold rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <strong>Note :</strong> Si les scores sont laissés vides, la mention "VS" sera affichée sur le site à condition que l'événement démarre dans le futur ou soit en cours. Si vous remplissez les deux scores, le résultat s'affichera sous la forme `4 - 1`.
          </div>

        </div>
      </SectionCard>
    </div>
  );
}
