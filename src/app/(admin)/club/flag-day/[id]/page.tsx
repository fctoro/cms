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

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [selectedTab, setSelectedTab] = useState("poules");
  const [tournament, setTournament] = useState<any>(null);
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
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      const [tourRes, matchRes, standingsRes, scorersRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/matches`),
        fetch(`/api/tournaments/${tournamentId}/standings`),
        fetch(`/api/tournaments/${tournamentId}/scorers`)
      ]);

      const [tour, matchesData, stand, scor] = await Promise.all([
        tourRes.json(),
        matchRes.json(),
        standingsRes.json(),
        scorersRes.json()
      ]);

      setTournament(tour.data);
      setMatches(matchesData.data || []);
      
      const cat = tour.data?.age_category || "U9";
      setStandings(stand.data?.[cat] || []);
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
      <p className="text-gray-500 font-medium">Chargement du tournoi...</p>
    </div>
  );

  const groupA = standings.filter(s => s.groupName === 'A' || s.group_name === 'A');
  const groupB = standings.filter(s => s.groupName === 'B' || s.group_name === 'B');
  
  const groupMatches = matches.filter(m => m.round.includes("Groupe"));
  const semiFinals = matches.filter(m => m.round.includes("Demi-finale"));
  const finals = matches.filter(m => m.round.includes("Finale") && !m.round.includes("Demi"));

  // Process Scorers for Display
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

      <PageBreadCrumb pageTitle={tournament?.name || "Détails du tournoi"} />

      {/* Header Statut */}
      <div className="bg-white dark:bg-white/[0.03] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center">
             <span className="text-xl font-black text-brand-500">{tournament?.age_category}</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{tournament?.name}</h1>
            <p className="text-xs text-gray-500 font-medium">Saison {tournament?.season} • {tournament?.status === 'in_progress' ? 'En cours' : tournament?.status === 'completed' ? 'Terminé' : 'Préparation'}</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
          {["poules", "matchs", "buteurs", "phases"].map((tab) => (
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
              {tab === 'phases' ? 'Bracket' : tab}
            </button>
          ))}
        </div>

        <button 
          onClick={() => router.push(`/club/flag-day/${tournamentId}/configuration`)}
          className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl hover:scale-105 transition-all"
        >
          Configurer
        </button>
      </div>

      {/* TABS CONTENT */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {selectedTab === "poules" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Column: Rankings */}
            <div className="xl:col-span-8 space-y-8">
              <RankingTable 
                title={`GROUPE A — ${tournament?.age_category}`} 
                teams={groupA} 
                headerColor="bg-[#E91E3B]" 
              />
              <RankingTable 
                title={`GROUPE B — ${tournament?.age_category}`} 
                teams={groupB} 
                headerColor="bg-[#2B56B2]" 
              />

              {/* Match Results at Bottom */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {groupMatches.slice(0, 6).map(m => (
                    <MatchCardSmall key={m.id} match={m} />
                 ))}
              </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="xl:col-span-4 space-y-8">
               <ScorersSidebar scorers={topScorers} category={tournament?.age_category} />
               <QualifiedSidebar 
                groupA={groupA.filter(t => t.is_qualified)} 
                groupB={groupB.filter(t => t.is_qualified)} 
               />
            </div>
          </div>
        )}

        {selectedTab === "matchs" && (
          <div className="space-y-6">
             <SectionCard title="Matchs de Poule" description="Gérez les scores et les buteurs de chaque rencontre.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {groupMatches.length === 0 ? (
                    <p className="col-span-full text-center py-10 text-gray-500 italic">Aucun match programmé.</p>
                   ) : (
                    groupMatches.map(m => (
                      <MatchCardLarge 
                        key={m.id} 
                        match={m} 
                        onEdit={() => {
                          setEditingMatch(m);
                          setScoreForm({ home: m.home_score || 0, away: m.away_score || 0 });
                          setMatchScorers([]);
                          setNewScorer({ name: "", team: m.home_team?.name || "", goals: 1 });
                        }} 
                      />
                    ))
                   )}
                </div>
             </SectionCard>
          </div>
        )}

        {selectedTab === "buteurs" && (
           <SectionCard title="Statistiques Buteurs" description="Classement détaillé des buteurs du tournoi.">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="py-4 px-4 text-xs font-black uppercase text-gray-400">Position</th>
                          <th className="py-4 px-4 text-xs font-black uppercase text-gray-400">Joueur</th>
                          <th className="py-4 px-4 text-xs font-black uppercase text-gray-400">Équipe</th>
                          <th className="py-4 px-4 text-xs font-black uppercase text-gray-400 text-right">Buts marqués</th>
                       </tr>
                    </thead>
                    <tbody>
                        {topScorers.length === 0 ? (
                           <tr><td colSpan={4} className="py-10 text-center text-gray-400 italic">Aucun buteur enregistré.</td></tr>
                        ) : (
                           topScorers.map((s, i) => (
                              <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                 <td className="py-5 px-6">
                                    <span className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
                                      i === 0 ? "bg-yellow-500 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500"
                                    )}>{i + 1}</span>
                                 </td>
                                 <td className="py-5 px-6 font-bold text-gray-900 dark:text-white uppercase">{s.name}</td>
                                 <td className="py-5 px-6 text-sm text-gray-500">{s.team}</td>
                                 <td className="py-5 px-6 text-right font-black text-brand-500 text-2xl">{s.goals}</td>
                              </tr>
                           ))
                        )}
                    </tbody>
                 </table>
              </div>
           </SectionCard>
        )}

        {selectedTab === "phases" && (
          <div className="space-y-12">
            <SectionCard title="Phases Finales" description="Arbre de compétition généré automatiquement.">
               <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-gray-400">Demi-Finales</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {semiFinals.length === 0 ? (
                          <p className="text-gray-500 italic py-4">Les demi-finales seront générées à la fin des poules.</p>
                        ) : (
                          semiFinals.map(m => <MatchCardLarge key={m.id} match={m} onEdit={() => {
                            setEditingMatch(m);
                            setScoreForm({ home: m.home_score || 0, away: m.away_score || 0 });
                          }} />)
                        )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-gray-400">Finale</h3>
                    <div className="max-w-2xl">
                        {finals.length === 0 ? (
                          <p className="text-gray-500 italic py-4">La finale sera générée après les demi-finales.</p>
                        ) : (
                          finals.map(m => <MatchCardLarge key={m.id} match={m} onEdit={() => {
                            setEditingMatch(m);
                            setScoreForm({ home: m.home_score || 0, away: m.away_score || 0 });
                          }} />)
                        )}
                    </div>
                  </div>
               </div>
            </SectionCard>
          </div>
        )}
      </div>

      {/* Modal Score Entry */}
      {editingMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                 <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Saisie du Score</h2>
                 <button onClick={() => setEditingMatch(null)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold">×</button>
              </div>
              <div className="p-8 space-y-8">
                 <div className="flex items-center justify-around gap-4 text-center">
                    <div className="flex-1">
                       <img src={editingMatch.home_team?.logo_url || "/images/logo/fc-toro.png"} className="w-20 h-20 mx-auto bg-gray-50 p-2 rounded-2xl object-contain mb-4" />
                       <p className="font-black uppercase text-sm tracking-tight line-clamp-1">{editingMatch.home_team?.name}</p>
                       <input 
                         type="number" 
                         value={scoreForm.home} 
                         onChange={e => setScoreForm({...scoreForm, home: parseInt(e.target.value) || 0})}
                         className="mt-4 w-20 h-20 bg-gray-50 dark:bg-white/5 border-none rounded-[2rem] text-3xl font-black text-center focus:ring-4 focus:ring-brand-500/20"
                       />
                    </div>
                    <div className="text-4xl font-black text-gray-300">VS</div>
                    <div className="flex-1">
                       <img src={editingMatch.away_team?.logo_url || "/images/logo/fc-toro.png"} className="w-20 h-20 mx-auto bg-gray-50 p-2 rounded-2xl object-contain mb-4" />
                       <p className="font-black uppercase text-sm tracking-tight line-clamp-1">{editingMatch.away_team?.name}</p>
                       <input 
                         type="number" 
                         value={scoreForm.away} 
                         onChange={e => setScoreForm({...scoreForm, away: parseInt(e.target.value) || 0})}
                         className="mt-4 w-20 h-20 bg-gray-50 dark:bg-white/5 border-none rounded-[2rem] text-3xl font-black text-center focus:ring-4 focus:ring-brand-500/20"
                       />
                    </div>
                 </div>

                 {/* Match Scorers Inline form */}
                 <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">Buteurs du match</h3>
                    <div className="flex gap-2 mb-4">
                       <input 
                         placeholder="Nom du joueur"
                         value={newScorer.name}
                         onChange={e => setNewScorer({...newScorer, name: e.target.value})}
                         className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm"
                       />
                       <select 
                         value={newScorer.team}
                         onChange={e => setNewScorer({...newScorer, team: e.target.value})}
                         className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm"
                       >
                          <option value={editingMatch.home_team?.name}>{editingMatch.home_team?.name}</option>
                          <option value={editingMatch.away_team?.name}>{editingMatch.away_team?.name}</option>
                       </select>
                       <input 
                         type="number"
                         min="1"
                         value={newScorer.goals}
                         onChange={e => setNewScorer({...newScorer, goals: parseInt(e.target.value) || 1})}
                         className="w-16 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-2 py-3 text-sm text-center font-bold"
                       />
                       <button onClick={addScorer} className="bg-brand-500 text-white w-12 rounded-xl font-bold transition-transform active:scale-95">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {matchScorers.map((s, i) => (
                          <div key={i} className="bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-gray-200 dark:border-white/10 flex items-center gap-2">
                             {s.playerName} ({s.teamName})
                             <button onClick={() => setMatchScorers(matchScorers.filter((_, idx) => idx !== i))} className="text-red-500">×</button>
                          </div>
                       ))}
                    </div>
                 </div>

                 <button 
                  onClick={handleSaveScore}
                  disabled={loading}
                  className="w-full py-5 bg-brand-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-brand-500/30 hover:bg-brand-600 transition-all disabled:opacity-50"
                 >
                    {loading ? "Enregistrement..." : "Valider le résultat"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function RankingTable({ title, teams, headerColor }: { title: string, teams: any[], headerColor: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/40 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
      <div className={cn("px-5 py-3 flex items-center gap-3", headerColor)}>
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        </div>
        <h3 className="text-white text-sm font-black uppercase tracking-wider">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/[0.02]">
              <th className="py-2.5 px-4 text-[9px] font-black uppercase text-gray-400">#</th>
              <th className="py-2.5 px-4 text-[9px] font-black uppercase text-gray-400">ÉQUIPE</th>
              <th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-900 dark:text-white text-center bg-gray-100/50 dark:bg-white/5">PTS</th>
              <th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">J</th>
              <th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">V</th>
              <th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">N</th>
              <th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">D</th>
              <th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">BM</th>
              <th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">BC</th>
              <th className="py-2.5 px-2 text-[9px] font-black uppercase text-gray-400 text-center">+/-</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {teams.length === 0 ? (
              <tr><td colSpan={10} className="py-6 text-center text-xs text-gray-400 italic">Aucune donnée disponible.</td></tr>
            ) : (
              teams.map((t, i) => (
                <tr key={t.teamId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <span className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
                      i === 0 ? "bg-[#FFC107] text-white" : "bg-gray-100 dark:bg-white/10 text-gray-400"
                    )}>{i + 1}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full border border-gray-100 dark:border-gray-800 p-1 flex items-center justify-center bg-white">
                        <img src={t.teamLogo || "/images/logo/fc-toro.png"} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#1A2D54] dark:text-white uppercase tracking-tight block">{t.teamName}</span>
                        {t.teamName.includes("FC Toro") && <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">HOME</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center bg-gray-50/50 dark:bg-white/[0.02]">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1A2D54] text-white font-black text-sm shadow-md">{t.points}</span>
                  </td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-gray-500">{t.played}</td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-green-500">{t.won}</td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-gray-400">{t.drawn}</td>
                  <td className="py-3 px-2 text-center text-xs font-bold text-red-500">{t.lost}</td>
                  <td className="py-3 px-2 text-center text-[10px] font-medium text-gray-500">{t.goals_for}</td>
                  <td className="py-3 px-2 text-center text-[10px] font-medium text-gray-500">{t.goals_against}</td>
                  <td className="py-3 px-2 text-center text-xs font-black">
                    <span className={cn(
                      t.goalDifference > 0 ? "text-green-500" : t.goalDifference < 0 ? "text-red-500" : "text-gray-400"
                    )}>
                      {t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScorersSidebar({ scorers, category }: { scorers: any[], category: string }) {
  return (
    <div className="bg-[#1A2D54] rounded-2xl overflow-hidden shadow-xl p-6 text-white relative">
      <div className="absolute top-6 right-6 opacity-10">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="5"/></svg>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.99 7.99 0 01-2.343 5.657z" /></svg>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest text-white/50">Catégorie {category}</p>
          <h3 className="text-lg font-black uppercase tracking-tight leading-none">Top Buteurs</h3>
        </div>
      </div>

      <div className="space-y-3">
        {scorers.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all">
            <span className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0",
              i === 0 ? "bg-[#FFC107] text-[#1A2D54] shadow-lg shadow-[#FFC107]/20" : 
              i === 1 ? "bg-gray-400 text-white" : 
              i === 2 ? "bg-[#CD7F32] text-white" : "bg-white/10 text-white/50"
            )}>{i + 1}</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
               <svg className="w-5 h-5 text-white/20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-bold uppercase tracking-tight text-xs line-clamp-2 leading-tight">{s.name}</p>
              <div className="flex items-center gap-1.5 opacity-40">
                 <div className="w-2 h-2 rounded-full bg-red-500" />
                 <span className="text-[9px] font-bold uppercase tracking-wider">{s.team}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
               <svg className="w-3 h-3 text-[#FFC107]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/></svg>
               <span className="text-xl font-black text-[#FFC107]">{s.goals}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QualifiedSidebar({ groupA, groupB }: { groupA: any[], groupB: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900/40 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 p-6">
       <div className="flex items-center gap-3 mb-6">
          <div className="text-xl">🏆</div>
          <h3 className="text-base font-black uppercase tracking-widest text-[#1A2D54] dark:text-white">Les Qualifiées</h3>
       </div>

       <div className="space-y-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 mb-3">Groupe A</p>
            <div className="space-y-2">
               {groupA.map(t => (
                  <div key={t.teamId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
                     <div className="flex items-center gap-3">
                        <img src={t.teamLogo} className="w-6 h-6 object-contain" />
                        <span className="font-black text-[11px] uppercase tracking-tight">{t.teamName}</span>
                     </div>
                     <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase rounded-md">Qualifié</span>
                  </div>
               ))}
               {groupA.length === 0 && <p className="text-[10px] text-gray-400 italic">En attente...</p>}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#2B56B2] mb-3">Groupe B</p>
            <div className="space-y-2">
               {groupB.map(t => (
                  <div key={t.teamId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
                     <div className="flex items-center gap-3">
                        <img src={t.teamLogo} className="w-6 h-6 object-contain" />
                        <span className="font-black text-[11px] uppercase tracking-tight">{t.teamName}</span>
                     </div>
                     <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase rounded-md">Qualifié</span>
                  </div>
               ))}
               {groupB.length === 0 && <p className="text-[10px] text-gray-400 italic">En attente...</p>}
            </div>
          </div>
       </div>
    </div>
  );
}

function MatchCardSmall({ match }: { match: Match }) {
  const isFinished = match.status === 'finished';
  const homeWin = isFinished && (match.home_score || 0) > (match.away_score || 0);
  const awayWin = isFinished && (match.away_score || 0) > (match.home_score || 0);
  const isDraw = isFinished && (match.home_score === match.away_score);
  const group = match.round.split('Groupe ')[1]?.charAt(0) || 'A';
  const isGroupA = group === 'A';

  return (
    <div className="bg-white dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative group overflow-hidden">
       <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full",
            isGroupA ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
          )}>
             <div className={cn("w-1.5 h-1.5 rounded-full", isGroupA ? "bg-red-500" : "bg-blue-500")} />
             <span className="text-[8px] font-black uppercase tracking-widest">GR. {group}</span>
          </div>
          <div className="px-2 py-0.5 bg-gray-50 dark:bg-white/5 rounded text-[8px] font-black text-gray-400">FT</div>
       </div>
       <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center gap-2 flex-1">
             <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center relative transition-all duration-500",
                homeWin ? "border-[3px] border-green-500 p-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "border border-gray-100 dark:border-gray-800 p-2 bg-gray-50/50"
             )}>
                <img 
                  src={match.home_team?.logo_url} 
                  className={cn("w-full h-full object-contain transition-all", (awayWin || (isDraw && isFinished)) && "grayscale opacity-40")} 
                />
                {homeWin && (
                   <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-black shadow-md animate-in zoom-in-50 duration-500">W</div>
                )}
             </div>
             <span className={cn(
                "text-[9px] font-black uppercase tracking-tight text-center line-clamp-2 min-h-[22px] leading-tight transition-colors",
                homeWin ? "text-[#1A2D54] dark:text-white" : "text-gray-400"
             )}>{match.home_team?.name}</span>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[60px]">
             {isFinished ? (
                <div className="flex flex-col items-center">
                   <div className="text-2xl font-black tracking-tighter flex items-center gap-2 text-[#1A2D54] dark:text-white">
                      <span className={cn(homeWin && "text-green-500")}>{match.home_score}</span>
                      <span className="text-gray-200">:</span>
                      <span className={cn(awayWin && "text-green-500")}>{match.away_score}</span>
                   </div>
                   {isDraw && <span className="text-[8px] font-black text-gray-400 tracking-[0.2em] mt-1">NUL</span>}
                   {!isDraw && <span className="text-[8px] font-black text-gray-300 tracking-[0.2em] mt-1">VS</span>}
                </div>
             ) : (
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">VS</span>
             )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
             <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center relative transition-all duration-500",
                awayWin ? "border-[3px] border-green-500 p-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "border border-gray-100 dark:border-gray-800 p-2 bg-gray-50/50"
             )}>
                <img 
                  src={match.away_team?.logo_url} 
                  className={cn("w-full h-full object-contain transition-all", (homeWin || (isDraw && isFinished)) && "grayscale opacity-40")} 
                />
                {awayWin && (
                   <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-black shadow-md animate-in zoom-in-50 duration-500">W</div>
                )}
             </div>
             <span className={cn(
                "text-[9px] font-black uppercase tracking-tight text-center line-clamp-2 min-h-[22px] leading-tight transition-colors",
                awayWin ? "text-[#1A2D54] dark:text-white" : "text-gray-400"
             )}>{match.away_team?.name}</span>
          </div>
       </div>
    </div>
  );
}

function MatchCardLarge({ match, onEdit }: { match: Match, onEdit: () => void }) {
  const isFinished = match.status === 'finished';
  const homeWin = isFinished && (match.home_score || 0) > (match.away_score || 0);
  const awayWin = isFinished && (match.away_score || 0) > (match.home_score || 0);

  return (
    <div className="bg-white dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg relative group transition-all hover:shadow-xl">
       <div className="flex items-center justify-between mb-5">
          <div className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{match.round}</span>
          </div>
          <span className="text-[9px] font-black text-gray-400">{new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
       </div>

       <div className="flex items-center justify-around gap-4 mb-8">
          <div className="flex-1 flex flex-col items-center gap-4">
             <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center relative transition-all duration-500 shadow-inner",
                homeWin ? "border-4 border-green-500 p-2.5 bg-white" : "border-2 border-gray-100 dark:border-gray-800 p-3 bg-gray-50/50"
             )}>
                <img 
                  src={match.home_team?.logo_url} 
                  className={cn("w-full h-full object-contain transition-all", awayWin && "grayscale opacity-30")} 
                />
                {homeWin && (
                   <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px] font-black shadow-lg">W</div>
                )}
             </div>
             <span className={cn(
                "font-black text-sm uppercase text-center tracking-tight leading-tight min-h-[32px] max-w-[120px]",
                homeWin ? "text-[#1A2D54] dark:text-white" : "text-gray-400"
             )}>{match.home_team?.name}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
             {isFinished ? (
                <div className="text-4xl font-black italic tracking-tighter flex items-center gap-3 text-[#1A2D54] dark:text-white">
                   <span className={cn("bg-gray-100 dark:bg-white/10 w-14 h-14 flex items-center justify-center rounded-2xl", homeWin && "text-green-500")}>{match.home_score}</span>
                   <span className="text-gray-300 opacity-50">-</span>
                   <span className={cn("bg-gray-100 dark:bg-white/10 w-14 h-14 flex items-center justify-center rounded-2xl", awayWin && "text-green-500")}>{match.away_score}</span>
                </div>
             ) : (
                <div className="bg-brand-500/10 text-brand-500 px-6 py-2 rounded-full font-black italic text-xl">VS</div>
             )}
          </div>

          <div className="flex-1 flex flex-col items-center gap-4">
             <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center relative transition-all duration-500 shadow-inner",
                awayWin ? "border-4 border-green-500 p-2.5 bg-white" : "border-2 border-gray-100 dark:border-gray-800 p-3 bg-gray-50/50"
             )}>
                <img 
                  src={match.away_team?.logo_url} 
                  className={cn("w-full h-full object-contain transition-all", homeWin && "grayscale opacity-30")} 
                />
                {awayWin && (
                   <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px] font-black shadow-lg">W</div>
                )}
             </div>
             <span className={cn(
                "font-black text-sm uppercase text-center tracking-tight leading-tight min-h-[32px] max-w-[120px]",
                awayWin ? "text-[#1A2D54] dark:text-white" : "text-gray-400"
             )}>{match.away_team?.name}</span>
          </div>
       </div>

       <button 
        onClick={onEdit}
        className="w-full py-4 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-black uppercase tracking-[0.1em] text-gray-500 hover:bg-[#1A2D54] hover:text-white transition-all shadow-sm"
       >
          Saisir le résultat
       </button>
    </div>
  );
}
