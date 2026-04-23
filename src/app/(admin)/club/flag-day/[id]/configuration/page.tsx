"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SectionCard, cn } from "@/components/common/CmsShared";

interface Team {
  id: string;
  name: string;
  logo_url: string;
}

interface Match {
  id: string;
  round: string;
  kickoff: string;
  home_team_id: string;
  away_team_id: string;
  venue: string;
  status: string;
  home_team?: Team;
  away_team?: Team;
}

export default function ManualConfigPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [activeTab, setActiveTab] = useState<"poules" | "matchs">("poules");
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Match Form State
  const [newMatch, setNewMatch] = useState({
    home_team_id: "",
    away_team_id: "",
    round: "",
    kickoff: "",
    venue: "Terrain Principal"
  });

  useEffect(() => {
    fetchInitialData();
  }, [tournamentId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tourRes, teamsRes, matchesRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/teams`),
        fetch(`/api/tournaments/${tournamentId}/matches`)
      ]);

      const tourData = await tourRes.json();
      const teamsData = await teamsRes.json();
      const matchesData = await matchesRes.json();

      setTournament(tourData.data);
      setTeams(teamsData.data || []);
      setMatches(matchesData.data || []);

      // Fetch category ID
      if (tourData.data?.age_category) {
        const catRes = await fetch(`/api/tournaments/${tournamentId}/standings`);
        const catData = await catRes.json();
        // Just to get the category info and existing group assignments
        // We need the category record explicitly
        const catIdRes = await fetch(`/api/tournaments/${tournamentId}/categories`); // Wait, does this exist?
        // Let's assume standings response helps us identify the group assignments
        const cat = tourData.data.age_category;
        setStandings(catData.data?.[cat] || []);
        
        // We'll need the real category UUID for insertions. 
        // Let's fetch it from a new/existing categories endpoint.
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // We need to find the categoryId. Let's add an effect for that.
  useEffect(() => {
    if (tournament?.age_category) {
        const fetchCatId = async () => {
            const res = await fetch(`/api/tournaments/${tournamentId}/categories?name=${tournament.age_category}`);
            const data = await res.json();
            if (data.success && data.data) {
                setCategoryId(data.data.id);
            }
        };
        fetchCatId();
    }
  }, [tournament]);

  const handleAssignGroup = async (teamId: string, groupName: string) => {
    if (!categoryId) return;
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/standings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, groupName, categoryId })
      });
      if (res.ok) {
        fetchInitialData();
        setSuccess("Groupe mis à jour !");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Erreur lors de l'assignation");
    }
  };

  const handleCreateMatch = async () => {
    if (!newMatch.home_team_id || !newMatch.away_team_id || !newMatch.round || !newMatch.kickoff) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMatch)
      });
      if (res.ok) {
        setNewMatch({ ...newMatch, home_team_id: "", away_team_id: "" }); // Reset
        fetchInitialData();
        setSuccess("Match programmé !");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Erreur lors de la programmation");
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Supprimer ce match ?")) return;
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches?matchId=${matchId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      setError("Erreur de suppression");
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400">Chargement de la configuration...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <PageBreadCrumb pageTitle={`Configuration : ${tournament?.name}`} />

      {/* Tabs Switcher */}
      <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-2xl w-fit mx-auto border border-gray-100 dark:border-white/10 shadow-sm">
        <button 
          onClick={() => setActiveTab("poules")}
          className={cn(
            "px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
            activeTab === "poules" ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          1. Poules
        </button>
        <button 
          onClick={() => setActiveTab("matchs")}
          className={cn(
            "px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
            activeTab === "matchs" ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          2. Calendrier
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-2xl text-sm font-bold animate-shake">{error}</div>}
      {success && <div className="p-4 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-2xl text-sm font-bold animate-bounce text-center">{success}</div>}

      {activeTab === "poules" && (
        <div className="grid lg:grid-cols-2 gap-8">
          <SectionCard 
            title="Équipes Engagées" 
            description="Assignez chaque équipe à une poule pour calculer les standings."
          >
            <div className="grid gap-3">
              {teams.map((item: any) => {
                const team = item.flagday_teams;
                const standing = standings.find(s => s.teamId === team.id);
                return (
                  <div key={team.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group hover:border-brand-500/30 transition-all">
                    <img src={team.logo_url} className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                    <span className="font-bold flex-1">{team.name}</span>
                    <div className="flex gap-1">
                      {["A", "B", "C", "D"].map(g => (
                        <button
                          key={g}
                          onClick={() => handleAssignGroup(team.id, g)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-xs font-black transition-all",
                            standing?.groupName === g 
                              ? "bg-brand-500 text-white" 
                              : "bg-white dark:bg-white/10 text-gray-400 hover:bg-gray-100"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Aperçu des Poules" description="Vérification de la répartition.">
             <div className="space-y-6">
                {["A", "B"].map(g => (
                  <div key={g} className="p-6 bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-3xl">
                     <h3 className="font-black text-brand-500 mb-4 uppercase tracking-widest">Poule {g}</h3>
                     <div className="space-y-2">
                        {standings.filter(s => s.groupName === g).length === 0 ? <p className="text-xs text-gray-400 italic">Vide</p> : 
                          standings.filter(s => s.groupName === g).map(s => (
                            <div key={s.teamId} className="flex items-center gap-2 text-sm font-bold">
                               <img src={s.teamLogo} className="w-5 h-5 object-contain" />
                               {s.teamName}
                            </div>
                          ))
                        }
                     </div>
                  </div>
                ))}
             </div>
          </SectionCard>
        </div>
      )}

      {activeTab === "matchs" && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <SectionCard title="Programmer un Match" description="Ajoutez un nouveau match au calendrier.">
              <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Équipe Domicile</label>
                   <select 
                    value={newMatch.home_team_id}
                    onChange={(e) => setNewMatch({...newMatch, home_team_id: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-bold"
                   >
                     <option value="">Sélectionner...</option>
                     {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.flagday_teams.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Équipe Extérieur</label>
                   <select 
                    value={newMatch.away_team_id}
                    onChange={(e) => setNewMatch({...newMatch, away_team_id: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-bold"
                   >
                     <option value="">Sélectionner...</option>
                     {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.flagday_teams.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Phase / Round</label>
                   <input 
                    placeholder="Ex: U15 - Groupe A"
                    value={newMatch.round}
                    onChange={(e) => setNewMatch({...newMatch, round: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-bold"
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Date et Heure</label>
                   <input 
                    type="datetime-local"
                    value={newMatch.kickoff}
                    onChange={(e) => setNewMatch({...newMatch, kickoff: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-bold"
                   />
                </div>
                <button 
                  onClick={handleCreateMatch}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                >
                  Ajouter au Calendrier
                </button>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-2">
            <SectionCard title="Calendrier Actuel" description="Liste des matchs enregistrés.">
              <div className="grid gap-3">
                {matches.length === 0 ? <p className="text-gray-400 py-10 text-center italic">Aucun match programmé.</p> : 
                  matches.map(m => (
                    <div key={m.id} className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl group">
                       <div className="flex-1">
                          <span className="text-[10px] font-black text-brand-500 uppercase block">{m.round}</span>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="font-bold text-sm">{m.home_team?.name}</span>
                             <span className="text-gray-300">vs</span>
                             <span className="font-bold text-sm">{m.away_team?.name}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-bold">{new Date(m.kickoff).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}</p>
                          <p className="text-xs text-gray-400">{new Date(m.kickoff).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                       <button 
                        onClick={() => handleDeleteMatch(m.id)}
                        className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                       >
                         ×
                       </button>
                    </div>
                  ))
                }
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      <div className="flex justify-center mt-12">
        <button 
          onClick={() => router.push(`/club/flag-day/${tournamentId}`)}
          className="px-12 py-5 bg-brand-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-brand-500/30 hover:scale-105 transition-all outline-none"
        >
          Terminer la configuration
        </button>
      </div>
    </div>
  );
}
