"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SectionCard, cn } from "@/components/common/CmsShared";
import Loader from "@/components/common/Loader";

const CATEGORIES = ["U9", "U11", "U13", "U15", "U17", "U19", "U21"];

interface Team {
  id: string;
  name: string;
  logo_url: string;
  color: string;
}

export default function NewCategoryWizard() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    age_category: "U15",
    selectedTeamIds: [] as string[],
  });

  // Manual Config State
  const [groups, setGroups] = useState<Record<string, string>>({}); // teamId -> "A" or "B"
  const [manualMatches, setManualMatches] = useState<any[]>([]);

  const [configMode, setConfigMode] = useState<"auto" | "manual">("auto");

  // Teams Data
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [searchTeam, setSearchTeam] = useState("");
  const [isAddingNewTeam, setIsAddingNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/tournaments/global-teams");
        const data = await res.json();
        setAvailableTeams(data.data || []);
      } catch (err) {
        console.error("Erreur teams:", err);
      }
    };
    fetchTeams();
  }, []);

  const nextStep = () => {
    if (step === 2 && formData.selectedTeamIds.length < 8 && configMode === "auto") {
      return setError("Il faut au moins 8 équipes pour un tirage automatique");
    }
    
    if (step === 3 && configMode === "manual") {
      // Initialize groups if not done
      const initialGroups: Record<string, string> = { ...groups };
      formData.selectedTeamIds.forEach((id, index) => {
        if (!initialGroups[id]) {
          initialGroups[id] = index < formData.selectedTeamIds.length / 2 ? "A" : "B";
        }
      });
      setGroups(initialGroups);
      generateManualMatches(initialGroups);
      setError("");
      setStep(4);
      return;
    }

    setError("");
    setStep(step + 1);
  };

  const generateManualMatches = (currentGroups: Record<string, string>) => {
    const teamsByGroup: Record<string, string[]> = {};
    Object.entries(currentGroups).forEach(([teamId, group]) => {
      if (!teamsByGroup[group]) teamsByGroup[group] = [];
      teamsByGroup[group].push(teamId);
    });

    const newMatches: any[] = [];
    Object.entries(teamsByGroup).forEach(([groupName, teamIds]) => {
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          newMatches.push({
            home_team_id: teamIds[i],
            away_team_id: teamIds[j],
            group: groupName,
            kickoff: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
            venue: "Terrain Principal"
          });
        }
      }
    });
    setManualMatches(newMatches);
  };

  const updateMatch = (index: number, field: string, value: string) => {
    const updated = [...manualMatches];
    updated[index] = { ...updated[index], [field]: value };
    setManualMatches(updated);
  };

  const handleGroupChange = (teamId: string, group: string) => {
    const updatedGroups = { ...groups, [teamId]: group };
    setGroups(updatedGroups);
    generateManualMatches(updatedGroups);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const toggleTeam = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTeamIds: prev.selectedTeamIds.includes(id)
        ? prev.selectedTeamIds.filter(tid => tid !== id)
        : [...prev.selectedTeamIds, id]
    }));
  };

  const addNewTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments/global-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });
      const data = await res.json();
      if (data.success) {
        setAvailableTeams([...availableTeams, data.data]);
        toggleTeam(data.data.id);
        setNewTeamName("");
        setIsAddingNewTeam(false);
      }
    } catch (err) {
      setError("Erreur lors de l'ajout de l'équipe");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Créer la catégorie
      const catRes = await fetch(`/api/tournaments/${tournamentId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.age_category }),
      });

      const catData = await catRes.json();
      if (!catRes.ok) throw new Error(catData.error);
      const categoryId = catData.data.id;

      // 2. Lier les équipes à la catégorie
      const teamsRes = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          teamIds: formData.selectedTeamIds,
          categoryId: categoryId 
        }),
      });

      if (!teamsRes.ok) throw new Error("Erreur lors de l'inscription des équipes");

      // 3. Générer le tirage au sort ou config manuelle
      if (configMode === "auto") {
        const drawRes = await fetch(`/api/tournaments/${tournamentId}/draw`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId })
        });

        if (!drawRes.ok) throw new Error("Erreur lors du tirage automatique");
        router.push(`/club/flag-day/${tournamentId}/categories/${categoryId}`);
      } else {
        // Enregistrer les groupes (standings) et les matchs manuels
        const manualRes = await fetch(`/api/tournaments/${tournamentId}/manual-config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            categoryId,
            groups: Object.entries(groups).map(([teamId, groupName]) => ({ teamId, groupName })),
            matches: manualMatches 
          })
        });

        if (!manualRes.ok) throw new Error("Erreur lors de la configuration manuelle");
        router.push(`/club/flag-day/${tournamentId}/categories/${categoryId}`);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  const filteredTeams = availableTeams.filter(t => 
    t.name.toLowerCase().includes(searchTeam.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <PageBreadCrumb pageTitle="Nouveau Championnat par Catégorie" />

      {/* Stepper Header */}
      <div className="bg-white dark:bg-white/[0.03] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-500">
        <div className="flex items-center justify-between relative">
          {[1, 2, 3, ...(configMode === "manual" ? [4] : [])].map((s) => (
            <div key={s} className="flex flex-col items-center z-10 transition-all duration-500">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500",
                step === s ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-110" : 
                step > s ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
              )}>
                {step > s ? "✓" : s}
              </div>
              <span className={cn("mt-2 text-[10px] font-bold uppercase tracking-wider", step === s ? "text-brand-500" : "text-gray-400")}>
                {s === 1 ? "Catégorie" : s === 2 ? "Équipes" : s === 3 ? "Génération" : "Planning"}
              </span>
            </div>
          ))}
          <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-100 dark:bg-gray-800 -z-0">
            <div 
              className="h-full bg-brand-500 transition-all duration-500" 
              style={{ width: `${((step - 1) / (configMode === "manual" ? 3 : 2)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {step === 1 && (
          <SectionCard title="Choix de la catégorie" description="Sélectionnez la catégorie d'âge pour ce championnat.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFormData({...formData, age_category: cat})}
                  className={cn(
                    "p-6 rounded-3xl border-2 transition-all text-center",
                    formData.age_category === cat 
                      ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold" 
                      : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                  )}
                >
                  <span className="text-xl">{cat}</span>
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard 
            title="Sélection des équipes" 
            description={`Sélectionnez au moins 8 équipes (${formData.selectedTeamIds.length} sélectionnées).`}
          >
            <div className="space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Rechercher une équipe..."
                  value={searchTeam}
                  onChange={e => setSearchTeam(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-6 py-3"
                />
                <button 
                  onClick={() => setIsAddingNewTeam(true)}
                  className="bg-brand-500 text-white px-6 rounded-2xl font-bold text-sm"
                >
                  + Créer Équipe
                </button>
              </div>

              {isAddingNewTeam && (
                <div className="p-6 bg-brand-50 dark:bg-brand-500/5 rounded-3xl flex gap-3 animate-in zoom-in-95 duration-200">
                  <input 
                    autoFocus
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    placeholder="Nom de la nouvelle équipe"
                    className="flex-1 bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-2"
                  />
                  <button onClick={addNewTeam} disabled={loading} className="text-brand-600 font-bold">Ajouter</button>
                  <button onClick={() => setIsAddingNewTeam(false)} className="text-gray-400">Annuler</button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredTeams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => toggleTeam(team.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                      formData.selectedTeamIds.includes(team.id)
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                        : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm"
                    )}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg p-1 shadow-sm border border-gray-100 flex-shrink-0">
                       <img src={team.logo_url || "/images/logo/fc-toro.png"} alt="" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs font-bold uppercase truncate flex-1">{team.name}</span>
                    {formData.selectedTeamIds.includes(team.id) && <span className="text-brand-500 text-xl">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard title="Configuration Finale" description="Prêt à lancer le tirage ?">
            <div className="p-8 bg-gray-50 dark:bg-white/[0.02] rounded-3xl space-y-4">
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <span className="text-gray-400 font-medium">Catégorie</span>
                <span className="font-black text-brand-500 text-xl">{formData.age_category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Équipes engagées</span>
                <span className="font-black text-xl">{formData.selectedTeamIds.length}</span>
              </div>

              <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Méthode de tirage</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setConfigMode("auto")}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all text-left",
                      configMode === "auto" 
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10" 
                        : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                    )}
                  >
                    <p className={cn("font-black uppercase text-sm", configMode === "auto" ? "text-brand-500" : "text-gray-700 dark:text-gray-300")}>Tirage Automatique</p>
                    <p className="text-[10px] text-gray-500 mt-2">2 Poules de 4 équipes générées par le système.</p>
                  </button>
                  <button
                    onClick={() => setConfigMode("manual")}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all text-left",
                      configMode === "manual" 
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10" 
                        : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                    )}
                  >
                    <p className={cn("font-black uppercase text-sm", configMode === "manual" ? "text-brand-500" : "text-gray-700 dark:text-gray-300")}>Saisie Manuelle</p>
                    <p className="text-[10px] text-gray-500 mt-2">Vous créerez vos groupes et matchs vous-même.</p>
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <SectionCard title="Organisation des Groupes" description="Répartissez les équipes dans les poules.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {["A", "B"].map(groupName => (
                  <div key={groupName} className="p-6 bg-gray-50 dark:bg-white/[0.02] rounded-[32px] border border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-black uppercase tracking-widest text-brand-500 mb-6 italic">Poule {groupName}</h3>
                    <div className="space-y-2">
                      {formData.selectedTeamIds.map(teamId => {
                        const team = availableTeams.find(t => t.id === teamId);
                        if (!team || groups[teamId] !== groupName) return null;
                        return (
                          <div key={teamId} className="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                              <img src={team.logo_url || "/images/logo/fc-toro.png"} alt="" className="w-6 h-6 object-contain" />
                              <span className="text-[10px] font-bold uppercase truncate max-w-[120px]">{team.name}</span>
                            </div>
                            <select 
                              value={groups[teamId]} 
                              onChange={(e) => handleGroupChange(teamId, e.target.value)}
                              className="bg-transparent border-none text-[10px] font-black uppercase text-brand-500 focus:ring-0"
                            >
                              <option value="A">Poule A</option>
                              <option value="B">Poule B</option>
                            </select>
                          </div>
                        );
                      })}
                      {Object.values(groups).filter(g => g === groupName).length === 0 && (
                        <p className="text-[10px] text-gray-400 italic py-4 text-center">Aucune équipe</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Programmation des Matchs" description="Définissez les horaires et lieux pour chaque rencontre.">
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {manualMatches.map((match, idx) => {
                  const home = availableTeams.find(t => t.id === match.home_team_id);
                  const away = availableTeams.find(t => t.id === match.away_team_id);
                  return (
                    <div key={idx} className="p-6 bg-white dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-50 dark:border-white/5">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex flex-col items-center gap-1 w-20">
                            <img src={home?.logo_url || "/images/logo/fc-toro.png"} className="w-10 h-10 object-contain" />
                            <span className="text-[8px] font-black uppercase text-center">{home?.name}</span>
                          </div>
                          <span className="text-brand-500 font-black italic">VS</span>
                          <div className="flex flex-col items-center gap-1 w-20">
                            <img src={away?.logo_url || "/images/logo/fc-toro.png"} className="w-10 h-10 object-contain" />
                            <span className="text-[8px] font-black uppercase text-center">{away?.name}</span>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-brand-500/10 text-brand-500 rounded-full text-[8px] font-black uppercase">
                          Poule {match.group}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Coup d'envoi</label>
                          <input 
                            type="datetime-local" 
                            value={match.kickoff}
                            onChange={(e) => updateMatch(idx, "kickoff", e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-[10px] font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Lieu</label>
                          <input 
                            type="text" 
                            value={match.venue}
                            onChange={(e) => updateMatch(idx, "venue", e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-[10px] font-bold"
                            placeholder="Ex: Terrain Principal"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold animate-in shake-100">
            {error}
          </div>
        )}

        <div className="mt-10 flex justify-between gap-4">
          {step > 1 && (
            <button 
              onClick={prevStep}
              className="flex-1 py-4 px-8 rounded-2xl border border-gray-200 dark:border-gray-800 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all outline-none"
            >
              Précédent
            </button>
          )}
          {step < (configMode === "manual" ? 4 : 3) ? (
            <button 
              onClick={nextStep}
              className="flex-[2] py-4 px-8 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-all outline-none shadow-xl"
            >
              Suivant
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] py-4 px-8 rounded-2xl bg-brand-500 text-white font-black uppercase tracking-widest hover:bg-brand-600 transition-all outline-none shadow-xl shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? "Génération..." : configMode === "auto" ? "Lancer le Tirage" : "Confirmer la création"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
