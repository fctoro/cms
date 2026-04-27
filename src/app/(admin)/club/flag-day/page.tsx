"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { cn } from "@/components/common/CmsShared";
import { useCms } from "@/context/CmsContext";
import Loader from "@/components/common/Loader";
import { getAdminToken } from "@/lib/admin-auth";

interface TournamentItem {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  status: "preparation" | "in_progress" | "completed";
  isPublished: boolean;
  ageCategory: string;
}

export default function FlagDayPage() {
  const { currentUser } = useCms();
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/tournaments");
      const data = await response.json();
      
      const transformed = (data.data || []).map((comp: any) => ({
        id: comp.id,
        name: comp.name,
        description: comp.description,
        startDate: comp.created_at,
        status: comp.status,
        isPublished: comp.is_published,
        ageCategory: comp.age_category,
      }));
      
      setTournaments(transformed);
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

  const togglePublication = async (id: string, currentStatus: boolean) => {
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/tournaments/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_published: !currentStatus }),
      });

      if (res.ok) {
        setTournaments(tournaments.map(t => t.id === id ? { ...t, isPublished: !currentStatus } : t));
        showToast(!currentStatus ? "Compétition publiée !" : "Compétition retirée.");
      }
    } catch (err) {
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const handleDelete = async () => {
    if (!tournamentToDelete) return;

    try {
      setLoading(true);
      const token = getAdminToken();
      const res = await fetch(`/api/tournaments/${tournamentToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setTournaments(tournaments.filter(t => t.id !== tournamentToDelete.id));
        showToast("Tournoi supprimé avec succès.");
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Erreur lors de la suppression.", "error");
      }
    } catch (err) {
      showToast("Erreur réseau.", "error");
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setTournamentToDelete(null);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "preparation":
        return { label: "En préparation", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
      case "in_progress":
        return { label: "En cours", color: "bg-green-500/10 text-green-500 border-green-500/20" };
      case "completed":
        return { label: "Terminé", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
      default:
        return { label: status, color: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Toast Notification Premium */}
      {toast && (
        <div className={cn(
          "fixed top-8 right-8 z-[100001] flex items-center gap-4 rounded-2xl px-6 py-4 shadow-2xl animate-in slide-in-from-right-full duration-500 backdrop-blur-md border",
          toast.type === "success" ? "bg-green-500/90 text-white border-green-400" : "bg-red-500/90 text-white border-red-400"
        )}>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span className="text-sm font-black uppercase tracking-wider">{toast.message}</span>
        </div>
      )}

      <PageBreadCrumb pageTitle="Championnats Flag Day" />

      {/* Header Section Premium */}
      <div className="relative group overflow-hidden bg-white dark:bg-[#1A2D54]/20 p-6 md:p-8 rounded-3xl md:rounded-[40px] border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
           <svg className="w-40 h-40 md:w-64 md:h-64 text-brand-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1A2D54] dark:text-white tracking-tighter uppercase italic">
              Gestion <span className="text-brand-500">Flag Day</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium max-w-xl">
              Pilotez l'excellence académique du FC TORO. Gérez les tournois, suivez les classements et célébrez les victoires en temps réel.
            </p>
          </div>
          
          <Link
            href="/club/flag-day/nouveau"
            className="flex w-full sm:w-auto items-center justify-center gap-3 bg-brand-500 hover:bg-brand-600 text-white px-6 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest transition-all hover:shadow-2xl hover:shadow-brand-500/40 active:scale-95 group text-sm"
          >
            Nouveau Tournoi
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="grid gap-5 md:gap-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center gap-6 bg-white dark:bg-white/5 rounded-[40px] border border-dashed border-gray-200 dark:border-white/10">
            <Loader />
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Synchronisation des données...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-gray-50/50 dark:bg-white/[0.02] rounded-[40px] border-2 border-dashed border-gray-100 dark:border-white/5">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <p className="text-xl text-gray-400 font-black uppercase tracking-tight">Aucun championnat actif</p>
            <p className="mt-2 text-gray-500 font-medium">Commencez par créer une nouvelle compétition pour la saison.</p>
          </div>
        ) : (
          tournaments.map((tournament) => {
            const statusInfo = getStatusInfo(tournament.status);
            return (
              <div
                key={tournament.id}
                className="group relative flex flex-col justify-between bg-white dark:bg-[#1A2D54]/10 rounded-3xl md:rounded-[40px] border border-gray-100 dark:border-white/5 p-5 md:p-8 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:hover:bg-[#1A2D54]/20 hover:-translate-y-1"
              >
                {/* Trash Button - Super Admin only */}
                {currentUser?.role === "super_admin" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setTournamentToDelete({ id: tournament.id, name: tournament.name });
                      setIsDeleteModalOpen(true);
                    }}
                    className="absolute top-2 right-2 z-10 w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl transition-all border border-red-100 dark:border-red-500/20 hover:bg-red-500 hover:text-white shadow-sm opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2 pr-6">
                    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border", statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                    <span className="px-3 py-1 bg-gray-50 dark:bg-white/5 text-gray-500 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border border-gray-100 dark:border-white/5">
                      {tournament.ageCategory || "GLOBAL"}
                    </span>
                  </div>
                  
                  <h3 className="mt-8 text-2xl font-black text-[#1A2D54] dark:text-white uppercase tracking-tighter leading-none group-hover:text-brand-500 transition-colors italic">
                    {tournament.name}
                  </h3>
                  <p className="mt-4 line-clamp-2 text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    {tournament.description || "Compétition officielle FC TORO Flag Day."}
                  </p>
                </div>

                <div className="mt-10 space-y-4 pt-8 border-t border-gray-50 dark:border-white/5">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Publication</span>
                       <span className={cn("text-[9px] font-bold uppercase", tournament.isPublished ? "text-green-500" : "text-gray-400")}>
                          {tournament.isPublished ? "Visible en ligne" : "Brouillon"}
                       </span>
                    </div>
                    <button
                      onClick={() => togglePublication(tournament.id, tournament.isPublished)}
                      className={cn(
                        "relative h-7 w-12 rounded-full transition-all duration-500 focus:outline-none p-1",
                        tournament.isPublished ? "bg-green-500" : "bg-gray-200 dark:bg-white/10"
                      )}
                    >
                      <span className={cn(
                        "block h-5 w-5 rounded-full bg-white shadow-xl transition-all duration-500",
                        tournament.isPublished ? "translate-x-5" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  <Link
                    href={`/club/flag-day/${tournament.id}`}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1A2D54] hover:bg-brand-500 py-4 text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-[#1A2D54]/10 hover:shadow-brand-500/20"
                  >
                    Gérer le tournoi
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal Premium - Smaller and Fixed z-index */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-6 bg-gray-950/90 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="bg-white dark:bg-gray-900 w-full max-w-[340px] rounded-[45px] shadow-[0_0_100px_rgba(239,68,68,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-700 border border-red-500/30">
              <div className="p-8 text-center space-y-6">
                 <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 bg-red-500 rounded-[30px] opacity-10 animate-ping" />
                    <div className="relative bg-red-50 dark:bg-red-500/10 rounded-[30px] w-full h-full flex items-center justify-center border-2 border-red-100 dark:border-red-500/20">
                       <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </div>
                 </div>
                 
                 <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Suppression ?</h2>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed px-4">
                       Voulez-vous effacer <span className="text-red-500 font-black italic underline underline-offset-4 decoration-2">"{tournamentToDelete?.name}"</span> ?<br/>
                       <span className="text-gray-400">Cette action est définitive.</span>
                    </p>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleDelete}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-500/40 hover:from-red-600 hover:to-red-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                    >
                       {loading ? "Suppression..." : "Confirmer"}
                    </button>
                    <button 
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setTournamentToDelete(null);
                      }}
                      className="w-full py-3 text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] text-[9px] hover:text-gray-900 dark:hover:text-white transition-all hover:tracking-[0.3em]"
                    >
                       Annuler
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
