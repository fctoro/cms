"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SectionCard, cn } from "@/components/common/CmsShared";
import Loader from "@/components/common/Loader";

export default function EditionDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tournament, setTournament] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [tourRes, catRes] = await Promise.all([
        fetch(`/api/tournaments/${id}`),
        fetch(`/api/tournaments/${id}/categories`)
      ]);

      const [tour, cats] = await Promise.all([
        tourRes.json(),
        catRes.json()
      ]);

      setTournament(tour.data);
      setCategories(cats.data || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <Loader />
      <p className="text-gray-500 font-medium">Chargement de l'édition...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <PageBreadCrumb pageTitle={tournament?.name || "Détails de l'Édition"} />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-white/[0.03] p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-500">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-widest">
              Édition {tournament?.season}
            </div>
            <div className="px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-500 text-[10px] font-black uppercase tracking-widest">
              {tournament?.status}
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4 leading-none">
            {tournament?.name}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-2xl leading-relaxed">
            {tournament?.description || "Aucune description fournie pour cette édition."}
          </p>
        </div>

        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-500/5 to-transparent pointer-events-none" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Championnats par catégorie</h2>
           <button 
             onClick={() => router.push(`/club/flag-day/${id}/categories/nouveau`)}
             className="px-6 py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
           >
             + Ajouter une catégorie
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {categories.length === 0 ? (
             <div className="col-span-full py-20 bg-gray-50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[40px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                   <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aucune catégorie créée</h3>
                <p className="text-sm text-gray-500 max-w-xs">Commencez par ajouter une catégorie (ex: U15) pour cet événement.</p>
             </div>
           ) : (
             categories.map((cat) => (
               <div 
                 key={cat.id} 
                 onClick={() => router.push(`/club/flag-day/${id}/categories/${cat.id}`)}
                 className="group relative overflow-hidden bg-white dark:bg-white/[0.03] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500 cursor-pointer"
               >
                 <div className="relative z-10 flex flex-col h-full">
                   <div className="flex items-center justify-between mb-6">
                     <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                       <span className="text-2xl font-black text-brand-500">{cat.name}</span>
                     </div>
                     <div className={cn(
                       "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                       cat.active ? "bg-teal-500/10 text-teal-500" : "bg-gray-500/10 text-gray-500"
                     )}>
                       {cat.active ? "Actif" : "Inactif"}
                     </div>
                   </div>
                   
                   <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">
                     Championnat {cat.name}
                   </h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8">
                     Gérez les équipes, les poules et les matchs pour la catégorie {cat.name}.
                   </p>
                   
                   <div className="mt-auto flex items-center gap-2 text-brand-500 font-bold text-sm">
                     Gérer la catégorie
                     <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                     </svg>
                   </div>
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
