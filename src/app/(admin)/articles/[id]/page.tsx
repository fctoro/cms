"use client";

import { StatusBadge, formatDate, formatNumber } from "@/components/common/CmsShared";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { useCms } from "@/context/CmsContext";
import { getAdminToken } from "@/lib/admin-auth";
import { CmsArticle } from "@/types/cms";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { EyeIcon, PencilIcon, TimeIcon } from "@/icons";

function mapArticle(row: Record<string, unknown>): CmsArticle {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    title: String(row.title_fr ?? row.titre_fr ?? ""),
    excerpt: String(row.excerpt_fr ?? row.extrait_fr ?? ""),
    body: String(row.content_fr ?? row.contenu_fr ?? ""),
    coverImage: String(row.cover_image ?? row.photo_couverture ?? "/images/grid-image/image-01.png"),
    category: String(row.category ?? row.categorie ?? "Articles"),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    authorId: String(row.author_id ?? row.auteur_id ?? row.auteur ?? ""),
    featured: Boolean(row.featured),
    status:
      row.status === "published" || row.statut === "publie" || row.statut === "published"
        ? "published"
        : row.status === "review" || row.statut === "revision" || row.statut === "review"
        ? "review"
        : row.status === "archived" || row.statut === "archive" || row.statut === "archived"
        ? "archived"
        : "draft",
    seoTitle: String(row.seo_title ?? row.titre_en ?? row.title_en ?? row.title_fr ?? ""),
    seoDescription: String(row.seo_description ?? row.extrait_fr ?? ""),
    createdAt: String(row.created_at ?? row.date_creation ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.date_modification ?? row.date_creation ?? new Date().toISOString()),
    publishedAt: row.published_at ? String(row.published_at) : (row.date_publication ? String(row.date_publication) : null),
    metrics: {
      views: Number(row.views ?? 0),
      linkClicks: Number(row.link_clicks ?? row.linkClicks ?? 0),
      shares: Number(row.shares ?? 0),
      leads: Number(row.leads ?? 0),
    },
  };
}

export default function ArticlePreviewPage() {
  const params = useParams<{ id: string }>();
  const { users, trackArticleView } = useCms();
  const [article, setArticle] = useState<CmsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();

    const loadArticle = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/articles/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const payload = await response.json();
      setArticle(mapArticle(payload.data));
      setLoading(false);
    };

    void loadArticle();
  }, [params.id]);

  useEffect(() => {
    if (article) {
      trackArticleView(article.id);
    }
  }, [article, trackArticleView]);

  const author = users.find((user) => user.id === article?.authorId);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col items-center gap-3">
          <Loader />
          <p className="text-sm font-medium text-gray-500">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 p-10 text-center dark:border-error-900/40 dark:bg-error-900/10">
        <p className="text-lg font-bold text-error-700 dark:text-error-300">Article introuvable.</p>
        <Link href="/articles" className="mt-4 inline-block text-sm font-medium text-brand-500 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Aperçu Article" />

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900/40">
        {/* Hero Section */}
        <div className="relative h-[400px] w-full">
          <img src={article.coverImage} alt={article.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 sm:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <StatusBadge value={article.status} />
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                {article.category}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white sm:text-5xl lg:max-w-4xl leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 sm:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
            {/* Meta Sidebar */}
            <div className="w-full lg:w-64 space-y-8">
              <div className="flex items-center gap-4">
                <img 
                  src={author?.avatar || "/images/user/owner.jpg"} 
                  alt={author?.name} 
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-500/20"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{author?.name || "Équipe Editorial"}</p>
                  <p className="text-xs text-gray-500">{formatDate(article.publishedAt || article.updatedAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Vues</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(article.metrics.views)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Clics</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(article.metrics.linkClicks)}</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {article.excerpt && (
                <p className="mb-8 text-xl font-medium leading-relaxed text-gray-600 italic border-l-4 border-brand-500 pl-6 dark:text-gray-400">
                  {article.excerpt}
                </p>
              )}
              
              <div
                className="cms-prose prose prose-lg dark:prose-invert max-w-none 
                  prose-headings:font-black prose-headings:tracking-tighter
                  prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300"
                dangerouslySetInnerHTML={{ __html: article.body }}
              />

              <div className="mt-12 flex flex-wrap gap-4 border-t border-gray-100 pt-10 dark:border-gray-800">
                <Link
                  href={`/articles/${article.id}/modifier`}
                  className="rounded-xl bg-brand-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 hover:shadow-brand-500/40"
                >
                  Modifier l'article
                </Link>
                <Link
                  href="/articles"
                  className="rounded-xl border border-gray-200 px-8 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Retour à la bibliothèque
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
