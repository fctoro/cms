"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { PencilIcon, TrashBinIcon } from "@/icons";
import Loader from "@/components/common/Loader";
import { cn } from "@/components/common/CmsShared";

interface ElitePlayer {
  id: string | number;
  number: string | number;
  first_name: string;
  last_name: string;
  position: string;
  club: string;
  weight: string;
  height: string;
  photo_url?: string;
  video_url?: string;
}

export default function EliteTable() {
  const router = useRouter();
  const [data, setData] = useState<ElitePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/club/elite");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Erreur de connexion au serveur");
      }
      const json = await response.json();
      setData(json.data || []);
    } catch (err: any) {
      console.error("Fetch Elite Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Supprimer ce joueur Elite ?")) return;
    try {
      const response = await fetch(`/api/club/elite/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erreur DB");
      fetchData();
    } catch (err) {
      alert("Erreur suppression");
    }
  };

  const filteredData = data.filter((m) =>
    (m.first_name + " " + m.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.club?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Search and Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-white/[0.03] p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="relative w-full max-w-md group">
          <input
            type="text"
            placeholder="Chercher un prodige Élite..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 pl-12 pr-4 py-3.5 text-sm transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:bg-transparent dark:border-white/10 dark:text-white group-hover:border-gray-300 dark:group-hover:border-white/20"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        
        <button 
          onClick={() => router.push("/club/elite/nouveau")}
          className="flex items-center gap-3 bg-[#1A2D54] hover:bg-brand-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-[#1A2D54]/10 hover:shadow-brand-500/20 active:scale-95"
        >
          <span>Ajouter Elite</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">{data.length}/10</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6 bg-white dark:bg-white/5 rounded-[40px] border border-dashed border-gray-200 dark:border-white/10">
          <Loader />
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Chargement du Roster Élite...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-32 text-center bg-gray-50/50 dark:bg-white/[0.02] rounded-[40px] border-2 border-dashed border-gray-100 dark:border-white/5">
           <p className="text-xl text-gray-400 font-black uppercase tracking-tight italic">Aucun joueur dans la sélection</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredData.map((player) => (
            <div
              key={player.id}
              className="group relative flex flex-col bg-white dark:bg-[#1A2D54]/10 rounded-[40px] border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500 hover:shadow-[0_30px_70px_rgba(0,0,0,0.08)] dark:hover:bg-[#1A2D54]/20 hover:-translate-y-2"
            >
              {/* Photo Section */}
              <div className="relative aspect-[4/5] overflow-hidden">
                {player.photo_url ? (
                   <Image
                    src={player.photo_url}
                    alt={player.first_name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                     <span className="text-4xl font-black text-gray-300 opacity-20">FC TORO</span>
                  </div>
                )}
                
                {/* Number Badge */}
                <div className="absolute top-6 left-6 w-12 h-12 bg-[#1A2D54] rounded-2xl flex items-center justify-center border-2 border-white shadow-xl">
                   <span className="text-white font-black italic text-lg">#{player.number}</span>
                </div>

                {/* Actions Overlay */}
                <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/club/elite/modifier/${player.id}`);
                    }}
                    className="w-10 h-10 bg-white/90 dark:bg-gray-900/90 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                    title="Modifier"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(player.id);
                    }}
                    className="w-10 h-10 bg-white/90 dark:bg-gray-900/90 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    title="Supprimer"
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Gradient Bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2D54] via-transparent to-transparent opacity-60" />
                
                {/* Info Overlay */}
                <div className="absolute bottom-6 left-8 right-8">
                   <p className="text-[10px] font-black uppercase text-brand-500 tracking-[0.2em] mb-1">{player.position}</p>
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none truncate">
                      {player.first_name} <span className="block text-sm opacity-90">{player.last_name}</span>
                   </h3>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Club</span>
                      <span className="text-xs font-bold text-[#1A2D54] dark:text-white truncate max-w-[120px]">{player.club || "N/A"}</span>
                   </div>
                   <div className="flex gap-4">
                      <div className="text-center">
                         <span className="block text-[8px] font-black text-gray-400 uppercase">KG</span>
                         <span className="text-[10px] font-bold dark:text-white">{player.weight || "-"}</span>
                      </div>
                      <div className="text-center">
                         <span className="block text-[8px] font-black text-gray-400 uppercase">HT</span>
                         <span className="text-[10px] font-bold dark:text-white">{player.height || "-"}</span>
                      </div>
                   </div>
                </div>

                {player.video_url && (
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase text-green-500 bg-green-500/10 py-2 px-4 rounded-xl border border-green-500/20">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                     Vidéo disponible
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
