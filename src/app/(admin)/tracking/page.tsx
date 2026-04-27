"use client";

import { useEffect, useState } from "react";
import { MetricCard, SectionCard, formatNumber } from "@/components/common/CmsShared";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { RiBarChartBoxLine, RiEyeLine, RiCursorLine, RiArticleLine, RiBriefcaseLine, RiGroupLine } from "@remixicon/react";

interface TrackingStats {
  overall: {
    totalVisits: number;
    totalCtaClicks: number;
  };
  articles: Array<{ id: string; title: string; views: number; link_clicks: number }>;
  stages: Array<{ id: string; title: string; views: number; applications: number; contact_clicks: number }>;
  partners: Array<{ id: string; name: string; clicks: number }>;
}

export default function TrackingPage() {
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/tracking/stats");
        if (res.ok) {
          const json = await res.json();
          setStats(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  const totalArticleViews = stats?.articles.reduce((acc, curr) => acc + curr.views, 0) || 0;
  const totalStageViews = stats?.stages.reduce((acc, curr) => acc + curr.views, 0) || 0;

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Analytics & Tracking" />

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
            <RiBarChartBoxLine size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Statistiques du site</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Suivi des performances et de l'engagement utilisateur.</p>
          </div>
        </div>
      </section>

      {/* Global Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard 
          label="Visites Accueil" 
          value={formatNumber(stats?.overall.totalVisits || 0)} 
        />
        <MetricCard 
          label="Clics CTA Accueil" 
          value={formatNumber(stats?.overall.totalCtaClicks || 0)} 
        />
        <MetricCard 
          label="Vues Articles (Top 5)" 
          value={formatNumber(totalArticleViews)} 
        />
        <MetricCard 
          label="Vues Stages (Top 5)" 
          value={formatNumber(totalStageViews)} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Read Articles */}
        <SectionCard 
          title="Articles les plus lus" 
          description="Classement par nombre de vues."
        >
          <div className="space-y-4">
            {stats?.articles.map((article, index) => (
              <div key={article.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 dark:bg-gray-800">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white/90">{article.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><RiEyeLine size={12} /> {formatNumber(article.views)} vues</span>
                      <span className="flex items-center gap-1"><RiCursorLine size={12} /> {formatNumber(article.link_clicks)} clics</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div 
                    className="h-full bg-brand-500 transition-all" 
                    style={{ width: `${(article.views / (stats.articles[0]?.views || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Most Viewed Stages */}
        <SectionCard 
          title="Recrutements les plus vus" 
          description="Engagement sur les offres de stages."
        >
          <div className="space-y-4">
            {stats?.stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 dark:bg-gray-800">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white/90">{stage.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><RiEyeLine size={12} /> {formatNumber(stage.views)} vues</span>
                      <span className="flex items-center gap-1"><RiGroupLine size={12} /> {formatNumber(stage.applications)} candidatures</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div 
                    className="h-full bg-orange-500 transition-all" 
                    style={{ width: `${(stage.views / (stats.stages[0]?.views || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Partner Clicks */}
        <SectionCard 
          title="Clics Partenaires" 
          description="Visibilité offerte aux partenaires."
        >
          <div className="space-y-4">
            {stats?.partners.map((partner, index) => (
              <div key={partner.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 dark:bg-white/5">
                    <RiBriefcaseLine size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white/90">{partner.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatNumber(partner.clicks)} clics sortants</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-bold text-gray-900 dark:text-white/90">{formatNumber(partner.clicks)}</p>
                   <p className="text-[10px] text-gray-500 uppercase font-black">Interactions</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Global Overview Card */}
        <SectionCard title="Performance Globale" description="Résumé des interactions clés.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/20">
              <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">Taux de conversion CTA</p>
              <p className="mt-2 text-3xl font-black text-brand-900 dark:text-white">
                {stats && stats.overall.totalVisits > 0 
                  ? `${Math.round((stats.overall.totalCtaClicks / stats.overall.totalVisits) * 100)}%`
                  : "0%"}
              </p>
              <p className="mt-1 text-[10px] text-brand-500/70 font-medium italic">Clics CTA / Visites accueil</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Conversion Stages</p>
              <p className="mt-2 text-3xl font-black text-emerald-900 dark:text-white">
                {stats && stats.stages.length > 0 && stats.stages[0].views > 0
                  ? `${Math.round((stats.stages[0].applications / stats.stages[0].views) * 100)}%`
                  : "0%"}
              </p>
              <p className="mt-1 text-[10px] text-emerald-500/70 font-medium italic">Candidatures / Vues (Offre top)</p>
            </div>
          </div>
          <div className="mt-6 p-5 rounded-[2rem] bg-gray-900 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-lg font-black uppercase tracking-tighter">Flux de données actif</h4>
              <p className="mt-1 text-xs text-gray-400 leading-relaxed">Les statistiques sont mises à jour en temps réel à chaque interaction sur le site public.</p>
            </div>
            <RiBarChartBoxLine className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
