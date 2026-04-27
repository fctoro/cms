"use client";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SectionCard } from "@/components/common/CmsShared";

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Analytics & Tracking" />

      <SectionCard 
        title="Module en cours de développement" 
        description="Le tableau de bord analytique avancé sera bientôt disponible."
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative flex items-center justify-center w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            {/* Spinning orbit dots */}
            <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
              <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 bg-brand-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">
            Analytique Avancée
          </h2>
          <p className="max-w-md text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
            Nous préparons un module complet pour suivre les performances de vos articles, vos offres de stage et l'engagement global de vos utilisateurs en temps réel.
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            Bientôt disponible
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
