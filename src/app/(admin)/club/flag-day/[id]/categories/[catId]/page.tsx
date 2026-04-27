"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SectionCard, cn } from "@/components/common/CmsShared";
import Loader from "@/components/common/Loader";

interface Match {
  id: string;
  round: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "finished";
  kickoff: string;
  home_team?: any;
  away_team?: any;
}

export default function CategoryManagementPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const categoryId = params.catId as string;

  const [selectedTab, setSelectedTab] = useState("poules");
  const [tournament, setTournament] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Match Scoring State
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [scoreForm, setScoreForm] = useState({ home: 0, away: 0 });
  const [matchScorers, setMatchScorers] = useState<{ playerName: string; teamName: string; goals: number }[]>([]);
  const [newScorer, setNewScorer] = useState({ name: "", team: "", goals: 1 });

  useEffect(() => {
    fetchData();
  }, [tournamentId, categoryId]);

  const fetchData = async () => {
    try {
      const [tourRes, matchRes, standingsRes, scorersRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/matches?categoryId=${categoryId}`),
        fetch(`/api/tournaments/${tournamentId}/standings?categoryId=${categoryId}`),
        fetch(`/api/tournaments/${tournamentId}/scorers?categoryId=${categoryId}`)
      ]);

      const [tour, matchesData, stand, scor] = await Promise.all([
        tourRes.json(),
        matchRes.json(),
        standingsRes.json(),
        scorersRes.json()
      ]);

      setTournament(tour.data);
      setMatches(matchesData.data || []);
      
      // Category info could be fetched separately or found in the list
      // For now let's assume we fetch category name in the dashboard and pass it or fetch it here
      const catRes = await fetch(`/api/tournaments/${tournamentId}/categories`);
      const cats = await catRes.json();
      const currentCat = cats.data?.find((c: any) => c.id === categoryId);
      setCategory(currentCat);

      setStandings(stand.data?.[currentCat?.name] || []);
      setScorers(scor.data || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveScore = async () => {
    if (!editingMatch) return;
    try {
      setLoading(true);
      
      const finalScorers = [...matchScorers];
      if (newScorer.name && newScorer.team) {
        finalScorers.push({
          playerName: newScorer.name,
          teamName: newScorer.team,
          goals: newScorer.goals
        });
      }

      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: editingMatch.id,
          categoryId: categoryId,
          homeScore: scoreForm.home,
          awayScore: scoreForm.away,
          scorers: finalScorers
        }),
      });

      if (res.ok) {
        showToast("Score enregistré !");
        setEditingMatch(null);
        await fetchData();
      }
    } catch (err) {
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setLoading(false);
    }
  };

  const addScorer = () => {
    if (!newScorer.name || !newScorer.team) return;
    setMatchScorers([...matchScorers, { playerName: newScorer.name, teamName: newScorer.team, goals: newScorer.goals }]);
    setNewScorer({ ...newScorer, name: "", goals: 1 });
  };

  if (loading && !tournament) return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <Loader />
      <p className="text-gray-500 font-medium">Chargement...</p>
    </div>
  );

  const groupA = standings.filter(s => s.groupName === 'A' || s.group_name === 'A');
  const groupB = standings.filter(s => s.groupName === 'B' || s.group_name === 'B');
  
  const groupMatches = matches.filter(m => m.round.includes("Groupe"));
  const semiFinals = matches.filter(m => m.round.includes("Demi-finale"));
  const finals = matches.filter(m => m.round.includes("Finale") && !m.round.includes("Demi"));

  const statsMap = new Map();
  const rawScorers = Array.isArray(scorers) ? scorers : [];
  rawScorers.forEach(s => {
    const pName = s.player_name || s.playerName || "Inconnu";
    const tName = s.team_name || s.teamName || "Inconnu";
    const gCount = Number(s.goals) || 0;
    const key = `${pName}-${tName}`;
    if (!statsMap.has(key)) statsMap.set(key, { name: pName, team: tName, goals: 0 });
    statsMap.get(key).goals += gCount;
  });
  const topScorers = Array.from(statsMap.values()).filter(s => s.goals > 0).sort((a,b) => b.goals - a.goals);

  return (
    <div className="space-y-8 relative pb-20">
      {toast && (
        <div className={cn(
          "fixed top-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-4 rounded-3xl px-8 py-4 shadow-2xl animate-in fade-in slide-in-from-top-10 duration-500",
          toast.type === "success" ? "bg-teal-500 text-white" : "bg-red-600 text-white"
        )}>
          <span className="text-lg font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <PageBreadCrumb pageTitle={`${tournament?.name} - ${category?.name || "Catégorie"}`} />

      {/* Header Statut */}
      <div className="bg-white dark:bg-white/[0.03] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center">
             <span className="text-xl font-black text-brand-500">{category?.name}</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{tournament?.name}</h1>
            <p className="text-xs text-gray-500 font-medium">Saison {tournament?.season} • {category?.name}</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
          {["poules", "matchs", "buteurs", "phases", "config"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                selectedTab === tab 
                  ? "bg-white dark:bg-white/10 text-brand-500 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              {tab === 'phases' ? 'Bracket' : tab === 'config' ? 'Configuration' : tab}
            </button>
          ))}
        </div>

        <button 
          onClick={() => router.push(`/club/flag-day/${tournamentId}`)}
          className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl hover:scale-105 transition-all"
        >
          Retour Dashboard
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {selectedTab === "poules" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <RankingTable title={`GROUPE A — ${category?.name}`} teams={groupA} headerColor="bg-[#E91E3B]" />
              <RankingTable title={`GROUPE B — ${category?.name}`} teams={groupB} headerColor="bg-[#2B56B2]" />
            </div>
            <div className="xl:col-span-4">
               <ScorersSidebar scorers={topScorers} category={category?.name} />
            </div>
          </div>
        )}
        
        {selectedTab === "matchs" && (
          <SectionCard title="Matchs de Poule" description="Gérez les scores et les buteurs.">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupMatches.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <p className="text-gray-400 font-medium italic">Aucun match programmé dans cette catégorie.</p>
                    <button onClick={() => setSelectedTab("config")} className="mt-4 text-brand-500 font-bold text-sm hover:underline">Aller dans Configuration</button>
                  </div>
                ) : (
                  groupMatches.map(m => (
                    <MatchCardLarge key={m.id} match={m} onEdit={() => {
                      setEditingMatch(m);
                      setScoreForm({ home: m.home_score || 0, away: m.away_score || 0 });
                      setMatchScorers([]);
                      setNewScorer({ name: "", team: m.home_team?.name || "", goals: 1 });
                    }} />
                  ))
                )}
             </div>
          </SectionCard>
        )}
        
        {selectedTab === "buteurs" && (
           <SectionCard title="Classement Buteurs">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead><tr className="border-b border-gray-100 dark:border-gray-800"><th className="py-4 px-4 text-xs font-black uppercase text-gray-400">Joueur</th><th className="py-4 px-4 text-xs font-black uppercase text-gray-400">Équipe</th><th className="py-4 px-4 text-xs font-black uppercase text-gray-400 text-right">Buts</th></tr></thead>
                    <tbody>
                       {topScorers.map((s, i) => (
                          <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5"><td className="py-5 px-6 font-bold uppercase">{s.name}</td><td className="py-5 px-6 text-sm text-gray-500">{s.team}</td><td className="py-5 px-6 text-right font-black text-brand-500 text-2xl">{s.goals}</td></tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </SectionCard>
        )}

        {selectedTab === "phases" && (
          <SectionCard title="Phases Finales">
             <div className="grid md:grid-cols-2 gap-6">
                {semiFinals.map(m => <MatchCardLarge key={m.id} match={m} onEdit={() => { setEditingMatch(m); setScoreForm({ home: m.home_score || 0, away: m.away_score || 0 }); }} />)}
             </div>
             <div className="mt-8 max-w-2xl">
                {finals.map(m => <MatchCardLarge key={m.id} match={m} onEdit={() => { setEditingMatch(m); setScoreForm({ home: m.home_score || 0, away: m.away_score || 0 }); }} />)}
             </div>
          </SectionCard>
        )}

        {selectedTab === "config" && (
          <ConfigurationTab 
            tournamentId={tournamentId} 
            categoryId={categoryId}
            categoryName={category?.name}
            onUpdate={() => fetchData()}
          />
        )}
      </div>

      {editingMatch && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[40px] p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
               <h2 className="text-xl font-black mb-8 uppercase tracking-tight">Saisie Score: {editingMatch.home_team?.name} vs {editingMatch.away_team?.name}</h2>
               <div className="flex items-center justify-center gap-8 mb-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">{editingMatch.home_team?.name}</p>
                    <input type="number" value={scoreForm.home} onChange={e => setScoreForm({...scoreForm, home: parseInt(e.target.value) || 0})} className="w-24 p-6 border-none bg-gray-50 dark:bg-white/5 rounded-3xl text-center text-3xl font-black focus:ring-4 focus:ring-brand-500/20" />
                  </div>
                  <span className="text-4xl font-black text-gray-300 italic">VS</span>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">{editingMatch.away_team?.name}</p>
                    <input type="number" value={scoreForm.away} onChange={e => setScoreForm({...scoreForm, away: parseInt(e.target.value) || 0})} className="w-24 p-6 border-none bg-gray-50 dark:bg-white/5 rounded-3xl text-center text-3xl font-black focus:ring-4 focus:ring-brand-500/20" />
                  </div>
               </div>
               
               <div className="mb-8 pt-8 border-t border-gray-50 dark:border-white/5">
                  <h3 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest text-center">Ajouter un buteur</h3>
                  <div className="flex gap-2">
                    <input placeholder="Nom" value={newScorer.name} onChange={e => setNewScorer({...newScorer, name: e.target.value})} className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-bold" />
                    <select value={newScorer.team} onChange={e => setNewScorer({...newScorer, team: e.target.value})} className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-bold">
                       <option value={editingMatch.home_team?.name}>{editingMatch.home_team?.name}</option>
                       <option value={editingMatch.away_team?.name}>{editingMatch.away_team?.name}</option>
                    </select>
                    <button onClick={addScorer} className="bg-brand-500 text-white w-10 h-10 rounded-xl font-bold">+</button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {matchScorers.map((s, i) => (
                      <div key={i} className="bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-2">
                        {s.playerName} ({s.teamName})
                        <button onClick={() => setMatchScorers(matchScorers.filter((_, idx) => idx !== i))} className="text-red-500">×</button>
                      </div>
                    ))}
                  </div>
               </div>

               <button onClick={handleSaveScore} className="w-full py-5 bg-brand-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all">Valider le résultat</button>
               <button onClick={() => setEditingMatch(null)} className="w-full mt-4 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:text-gray-900 dark:hover:text-white transition-colors">Annuler</button>
            </div>
         </div>
      )}
    </div>
  );
}

function ConfigurationTab({ tournamentId, categoryId, categoryName, onUpdate }: { tournamentId: string, categoryId: string, categoryName: string, onUpdate: () => void }) {
  const [teams, setTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMatch, setNewMatch] = useState({
    home_team_id: "",
    away_team_id: "",
    round: `${categoryName} - Groupe A`,
    kickoff: "",
    venue: "Terrain Principal"
  });

  useEffect(() => {
    loadData();
  }, [tournamentId, categoryId]);

  const loadData = async () => {
    try {
      const [teamsRes, standRes, matchesRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/teams?categoryId=${categoryId}`),
        fetch(`/api/tournaments/${tournamentId}/standings?categoryId=${categoryId}`),
        fetch(`/api/tournaments/${tournamentId}/matches?categoryId=${categoryId}`)
      ]);
      const [teamsData, standData, matchesData] = await Promise.all([
        teamsRes.json(),
        standRes.json(),
        matchesRes.json()
      ]);
      setTeams(teamsData.data || []);
      setStandings(standData.data?.[categoryName] || []);
      setMatches(matchesData.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignGroup = async (teamId: string, groupName: string) => {
    try {
      setLoading(true);
      await fetch(`/api/tournaments/${tournamentId}/standings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, groupName, categoryId })
      });
      await loadData();
      onUpdate();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!newMatch.home_team_id || !newMatch.away_team_id || !newMatch.round || !newMatch.kickoff) return;
    try {
      setLoading(true);
      await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newMatch, categoryId })
      });
      setNewMatch({ ...newMatch, home_team_id: "", away_team_id: "" });
      await loadData();
      onUpdate();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Supprimer ce match ?")) return;
    try {
      await fetch(`/api/tournaments/${tournamentId}/matches?matchId=${matchId}`, {
        method: "DELETE"
      });
      await loadData();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <SectionCard title="1. Répartition des Poules" description="Assignez chaque équipe à un groupe.">
        <div className="space-y-2">
          {teams.map(item => (
            <div key={item.team_id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              <img src={item.flagday_teams.logo_url} className="w-8 h-8 object-contain" />
              <span className="font-bold flex-1 text-sm uppercase">{item.flagday_teams.name}</span>
              <div className="flex gap-1">
                {["A", "B"].map(g => {
                  const isActive = standings.find(s => s.teamId === item.team_id)?.groupName === g;
                  return (
                    <button key={g} onClick={() => handleAssignGroup(item.team_id, g)} className={cn("w-8 h-8 rounded-lg text-xs font-black transition-all", isActive ? "bg-brand-500 text-white" : "bg-white dark:bg-white/10 text-gray-400 hover:bg-gray-100")}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="space-y-8">
        <SectionCard title="2. Programmer un Match" description="Ajoutez manuellement les rencontres.">
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                 <select value={newMatch.home_team_id} onChange={e => setNewMatch({...newMatch, home_team_id: e.target.value})} className="bg-gray-50 dark:bg-white/5 border-none rounded-xl p-3 text-xs font-bold">
                    <option value="">Domicile...</option>
                    {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.flagday_teams.name}</option>)}
                 </select>
                 <select value={newMatch.away_team_id} onChange={e => setNewMatch({...newMatch, away_team_id: e.target.value})} className="bg-gray-50 dark:bg-white/5 border-none rounded-xl p-3 text-xs font-bold">
                    <option value="">Extérieur...</option>
                    {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.flagday_teams.name}</option>)}
                 </select>
              </div>
              <input placeholder="Round (ex: Groupe A)" value={newMatch.round} onChange={e => setNewMatch({...newMatch, round: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl p-3 text-xs font-bold" />
              <div className="grid grid-cols-2 gap-2">
                <input type="datetime-local" value={newMatch.kickoff} onChange={e => setNewMatch({...newMatch, kickoff: e.target.value})} className="bg-gray-50 dark:bg-white/5 border-none rounded-xl p-3 text-xs font-bold" />
                <input placeholder="Lieu" value={newMatch.venue} onChange={e => setNewMatch({...newMatch, venue: e.target.value})} className="bg-gray-50 dark:bg-white/5 border-none rounded-xl p-3 text-xs font-bold" />
              </div>
              <button onClick={handleCreateMatch} disabled={loading} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[10px]">Programmer le Match</button>
           </div>
        </SectionCard>

        <SectionCard title="Matchs Programmés" description="Aperçu du calendrier actuel.">
           <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {matches.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl group">
                   <div className="flex-1">
                      <p className="text-[8px] font-black text-brand-500 uppercase">{m.round}</p>
                      <p className="text-[10px] font-bold uppercase">{m.home_team?.name} vs {m.away_team?.name}</p>
                   </div>
                   <button onClick={() => handleDeleteMatch(m.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-all font-bold">×</button>
                </div>
              ))}
           </div>
        </SectionCard>
      </div>
    </div>
  );
}

function RankingTable({ title, teams, headerColor }: { title: string, teams: any[], headerColor: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/40 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
      <div className={cn("px-5 py-3 flex items-center gap-3", headerColor)}>
        <h3 className="text-white text-sm font-black uppercase tracking-wider">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="bg-gray-50/50 dark:bg-white/[0.02]"><th className="py-2.5 px-4 text-[9px] font-black uppercase text-gray-400">#</th><th className="py-2.5 px-4 text-[9px] font-black uppercase text-gray-400">ÉQUIPE</th><th className="py-2.5 px-2 text-[9px] font-black uppercase text-center bg-gray-100/50 dark:bg-white/5">PTS</th><th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">J</th><th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">V</th><th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">N</th><th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">D</th><th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">BM</th><th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">BC</th><th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">+/-</th></tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {teams.map((t, i) => (
                <tr key={t.teamId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 px-4"><span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-black", i === 0 ? "bg-[#FFC107] text-white" : "bg-gray-100 dark:bg-white/10 text-gray-400")}>{i + 1}</span></td>
                  <td className="py-3 px-4"><div className="flex items-center gap-3"><img src={t.teamLogo} className="w-6 h-6 object-contain" /><span className="font-bold text-xs uppercase">{t.teamName}</span></div></td>
                  <td className="py-3 px-2 text-center bg-gray-50/50 dark:bg-white/[0.02]"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1A2D54] text-white font-black text-sm">{t.points}</span></td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-gray-500">{t.played}</td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-green-500">{t.won}</td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-gray-400">{t.drawn}</td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-red-500">{t.lost}</td>
                  <td className="py-3 px-2 text-center text-[10px] text-gray-500">{t.goals_for}</td>
                  <td className="py-3 px-2 text-center text-[10px] text-gray-500">{t.goals_against}</td>
                  <td className="py-3 px-2 text-center text-xs font-black"><span className={cn(t.goalDifference > 0 ? "text-green-500" : t.goalDifference < 0 ? "text-red-500" : "text-gray-400")}>{t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}</span></td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScorersSidebar({ scorers, category }: { scorers: any[], category: string }) {
  return (
    <div className="bg-[#1A2D54] rounded-2xl p-6 text-white">
      <h3 className="text-lg font-black uppercase mb-6 tracking-tight">Top Buteurs {category}</h3>
      <div className="space-y-3">
        {scorers.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FFC107] text-[#1A2D54] text-xs font-black">{i + 1}</span>
            <div className="flex-1"><p className="font-bold uppercase text-xs">{s.name}</p><p className="text-[9px] opacity-40 uppercase">{s.team}</p></div>
            <span className="text-xl font-black text-[#FFC107]">{s.goals}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCardLarge({ match, onEdit }: { match: Match, onEdit: () => void }) {
  const isFinished = match.status === 'finished';
  return (
    <div className="bg-white dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg relative group transition-all hover:shadow-xl">
       <div className="flex items-center justify-between mb-5">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{match.round}</span>
          <span className="text-[9px] font-black text-gray-400">{new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
       </div>
       <div className="flex items-center justify-around gap-4 mb-8">
          <div className="flex-1 flex flex-col items-center gap-4">
             <img src={match.home_team?.logo_url} className="w-16 h-16 object-contain" />
             <span className="font-black text-xs uppercase text-center">{match.home_team?.name}</span>
          </div>
          <div className="text-2xl font-black italic">
             {isFinished ? `${match.home_score} - ${match.away_score}` : "VS"}
          </div>
          <div className="flex-1 flex flex-col items-center gap-4">
             <img src={match.away_team?.logo_url} className="w-16 h-16 object-contain" />
             <span className="font-black text-xs uppercase text-center">{match.away_team?.name}</span>
          </div>
       </div>
       <button onClick={onEdit} className="w-full py-4 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-black uppercase text-gray-500 hover:bg-[#1A2D54] hover:text-white transition-all">Saisir score</button>
    </div>
  );
}
