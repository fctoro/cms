"use client";

import { SectionCard, StatusBadge, formatDate, formatNumber } from "@/components/common/CmsShared";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { getAdminToken } from "@/lib/admin-auth";
import { fetchAdminJson, mapDbArticle, mapDbUser } from "@/lib/cms-admin-client";
import { CmsArticle, CmsUser } from "@/types/cms";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Loader from "@/components/common/Loader";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<CmsArticle[]>([]);
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [articlesPayload, usersPayload] = await Promise.all([
          fetchAdminJson("/api/admin/articles?limit=100"),
          fetchAdminJson("/api/admin/users"),
        ]);
        setArticles(
          Array.isArray(articlesPayload.data)
            ? articlesPayload.data.map(mapDbArticle)
            : [],
        );
        setUsers(
          Array.isArray(usersPayload.data) ? usersPayload.data.map(mapDbUser) : [],
        );
      } catch (error) {
        console.error("[ArticlesPage] chargement impossible", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || article.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [articles, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Articles" />

      <SectionCard
        title="Bibliothèque d'articles"
        description="Gérez vos publications avec une vue d'ensemble sur les performances."
        actions={
          <Link
            href="/articles/nouveau"
            className="rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            Nouvel article
          </Link>
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par titre ou catégorie"
              className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-theme-xs outline-hidden transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-theme-xs outline-hidden transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader />
            <p className="text-sm font-medium text-gray-400">Chargement de la bibliothèque...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            Aucun article trouvé.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => {
              const author = users.find((user) => user.id === article.authorId);
              return (
                <div 
                  key={article.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:border-brand-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/40 dark:hover:border-brand-500/30"
                >
                  {/* Image & Category */}
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img
                      src={article.coverImage || "/images/grid-image/image-01.png"}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = '/images/logo/fc-toro.png';
                      }}
                    />
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                        {article.category}
                      </span>
                    </div>
                    <div className="absolute right-3 top-3">
                       <StatusBadge value={article.status} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(article.publishedAt || article.updatedAt)}</span>
                      <span>{author?.name || "Auteur inconnu"}</span>
                    </div>
                    
                    <h3 className="mb-4 line-clamp-2 text-lg font-bold text-gray-900 transition group-hover:text-brand-500 dark:text-white/90">
                      {article.title}
                    </h3>

                    {/* Metrics */}
                    <div className="mt-auto flex items-center gap-4 border-t border-gray-50 pt-4 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <EyeIcon className="size-4 opacity-70" />
                        <span>{formatNumber(article.metrics.views)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <PencilIcon className="size-4 opacity-70" />
                        <span>{formatNumber(article.metrics.linkClicks)} clics</span>
                      </div>
                    </div>

                    {/* Actions Overlay / Menu */}
                    <div className="mt-5 flex items-center gap-2">
                       <Link
                          href={`/articles/${article.id}`}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-50 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                          <EyeIcon className="size-4" />
                          Aperçu
                        </Link>
                        <Link
                          href={`/articles/${article.id}/modifier`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-brand-500 hover:text-brand-500 dark:border-gray-800 dark:text-gray-400"
                        >
                          <PencilIcon className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Voulez-vous vraiment supprimer cet article ?")) return;
                            const token = getAdminToken();
                            if (!token) return;
                            const response = await fetch(`/api/admin/articles/${article.id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (!response.ok) return;
                            setArticles((prev) => prev.filter((item) => item.id !== article.id));
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-error-500 hover:text-error-500 dark:border-gray-800 dark:text-gray-400"
                        >
                          <TrashBinIcon className="size-4" />
                        </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
