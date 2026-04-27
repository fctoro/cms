"use client";

import { SectionCard, FieldLabel, TextInput, TextAreaInput, ImageField } from "@/components/common/CmsShared";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { getAdminToken } from "@/lib/admin-auth";
import Loader from "@/components/common/Loader";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Slide = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  btn_label: string;
  btn_url: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY: Omit<Slide, "id"> = {
  badge: "ÉVÉNEMENT",
  title: "",
  subtitle: "",
  btn_label: "",
  btn_url: "#",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

// ─── Mini Preview ──────────────────────────────────────────────────────────────

function SlidePreview({ slide }: { slide: Partial<Slide> }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ aspectRatio: "16/7" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: slide.image_url
            ? `url(${slide.image_url})`
            : undefined,
          backgroundColor: slide.image_url ? undefined : "#1a1a2e",
        }}
      />
      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
        {slide.badge && (
          <span className="mb-3 inline-flex w-fit rounded-sm bg-brand-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white">
            {slide.badge}
          </span>
        )}
        <h3
          className="text-xl font-bold leading-tight text-white sm:text-2xl drop-shadow-md"
        >
          {slide.title || <span className="opacity-30">Titre du slide…</span>}
        </h3>
        {slide.subtitle && (
          <p className="mt-2 text-sm text-gray-200">{slide.subtitle}</p>
        )}
        {slide.btn_label && (
          <div className="mt-4">
            <span className="inline-flex items-center rounded border border-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-white">
              {slide.btn_label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

function SlideModal({
  slide,
  onClose,
  onSave,
}: {
  slide: Partial<Slide> | null;
  onClose: () => void;
  onSave: (data: Partial<Slide>) => Promise<void>;
}) {
  const isNew = !slide?.id;
  const [form, setForm] = useState<Omit<Slide, "id">>({ ...EMPTY, ...(slide ?? {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string | number | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Le titre est obligatoire."); return; }
    setError(null);
    setSaving(true);
    try {
      await onSave({ ...form, id: slide?.id });
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur de sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-6">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {isNew ? "Nouveau slide" : "Modifier le slide"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Le slide apparaîtra dans le carrousel du site public.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">

            {/* Live Preview */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Aperçu en direct</p>
              <SlidePreview slide={form} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel hint="Ex: ÉVÉNEMENT, ACTUALITÉ, TOURNOI">Badge / Étiquette</FieldLabel>
                <TextInput
                  id="slide-badge"
                  value={form.badge}
                  onChange={(e) => set("badge", e.target.value.toUpperCase())}
                  placeholder="ÉVÉNEMENT"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel hint="Ordre d'affichage (0 = premier)">Ordre</FieldLabel>
                <TextInput
                  id="slide-order"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => set("sort_order", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel hint="Texte principal du slide, en majuscules impactantes.">Titre principal *</FieldLabel>
              <TextAreaInput
                id="slide-title"
                rows={3}
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ex: VERTIÈRE CUP TRÈS PROCHAINEMENT. INSCRIVEZ VOTRE ÉQUIPE, FINALE LE 18 NOV 2026."
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel hint="Sous-titre optionnel affiché sous le titre.">Sous-titre (optionnel)</FieldLabel>
              <TextInput
                id="slide-subtitle"
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="Description courte..."
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel hint="Texte affiché sur le bouton.">Texte du bouton</FieldLabel>
                <TextInput
                  id="slide-btn-label"
                  value={form.btn_label}
                  onChange={(e) => set("btn_label", e.target.value.toUpperCase())}
                  placeholder="PARTICIPER"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel hint="URL vers laquelle le bouton redirige.">Lien du bouton</FieldLabel>
                <TextInput
                  id="slide-btn-url"
                  type="url"
                  value={form.btn_url}
                  onChange={(e) => set("btn_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <ImageField
              label="Image de fond du slide"
              value={form.image_url}
              onChange={(url) => set("image_url", url)}
              hint="Recommandé : 1920×1080px, format paysage."
            />

            {/* Statut actif */}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Slide actif</p>
                <p className="text-xs text-gray-500">Un slide inactif ne s'affiche pas sur le site.</p>
              </div>
              <button
                type="button"
                onClick={() => set("is_active", !form.is_active)}
                className={`relative h-6 w-11 rounded-full transition ${form.is_active ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-700"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${form.is_active ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </label>

            {error && (
              <p className="rounded-xl bg-error-50 dark:bg-error-900/10 border border-error-200 dark:border-error-900/30 px-4 py-3 text-sm text-error-700 dark:text-error-300">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors">
              {saving && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {saving ? "Enregistrement..." : isNew ? "Créer le slide" : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Slide Card ────────────────────────────────────────────────────────────────

function SlideCard({
  slide,
  onEdit,
  onDelete,
  onToggle,
}: {
  slide: Slide;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className={`group relative rounded-2xl border bg-white dark:bg-white/[0.03] overflow-hidden shadow-theme-xs transition-all hover:shadow-md ${
      slide.is_active
        ? "border-gray-200 dark:border-gray-800"
        : "border-dashed border-gray-300 dark:border-gray-700 opacity-60"
    }`}>
      {/* Image preview */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/7" }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: slide.image_url ? `url(${slide.image_url})` : undefined,
            backgroundColor: slide.image_url ? undefined : "#111827",
          }}
        />
        <div className="absolute inset-0 bg-black/50" />

        {/* Overlay badge + title */}
        <div className="relative flex h-full flex-col justify-end p-4">
          {slide.badge && (
            <span className="mb-2 inline-flex w-fit rounded-sm bg-brand-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
              {slide.badge}
            </span>
          )}
          <p
            className="line-clamp-2 text-sm font-bold leading-tight text-white drop-shadow-md"
          >
            {slide.title}
          </p>
          {slide.btn_label && (
            <span className="mt-2 inline-flex w-fit border border-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80">
              {slide.btn_label}
            </span>
          )}
        </div>

        {/* Order badge */}
        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white backdrop-blur">
          #{slide.sort_order}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
            slide.is_active
              ? "bg-success-50 dark:bg-success-900/10 text-success-700 dark:text-success-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${slide.is_active ? "bg-success-500" : "bg-gray-400"}`} />
          {slide.is_active ? "Actif" : "Inactif"}
        </button>

        <div className="flex items-center gap-2">
          <button
            id={`btn-edit-slide-${slide.id}`}
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Modifier
          </button>
          <button
            id={`btn-delete-slide-${slide.id}`}
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-error-200 dark:border-error-900/40 px-3 py-1.5 text-xs font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/10 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function PagesAdminPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<Slide> | null | undefined>(undefined);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const token = () => getAdminToken() ?? "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/slides", {
        headers: { Authorization: `Bearer ${token()}` },
        cache: "no-store",
      });
      const json = await res.json();
      setSlides(Array.isArray(json.data) ? json.data : []);
    } catch {
      showToast("Chargement impossible.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (data: Partial<Slide>) => {
    const isNew = !data.id;
    const res = await fetch("/api/admin/slides", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erreur.");
    if (isNew) {
      setSlides((prev) => [...prev, json.data].sort((a, b) => a.sort_order - b.sort_order));
    } else {
      setSlides((prev) => prev.map((s) => s.id === data.id ? json.data : s).sort((a, b) => a.sort_order - b.sort_order));
    }
    showToast(isNew ? "Slide créé avec succès !" : "Slide mis à jour.");
  };

  const handleToggle = async (slide: Slide) => {
    try {
      const res = await fetch("/api/admin/slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...slide, is_active: !slide.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSlides((prev) => prev.map((s) => s.id === slide.id ? json.data : s));
      showToast(json.data.is_active ? "Slide activé." : "Slide désactivé.");
    } catch {
      showToast("Erreur lors du changement de statut.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/slides?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setSlides((prev) => prev.filter((s) => s.id !== id));
      showToast("Slide supprimé.");
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  const activeCount = slides.filter((s) => s.is_active).length;
  const inactiveCount = slides.length - activeCount;

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Pages · Slides" />



      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total slides", value: slides.length, color: "text-gray-900 dark:text-white", bg: "bg-gray-50 dark:bg-white/[0.03]" },
          { label: "Actifs", value: activeCount, color: "text-success-600 dark:text-success-400", bg: "bg-success-50 dark:bg-success-900/10" },
          { label: "Inactifs", value: inactiveCount, color: "text-gray-400", bg: "bg-gray-50 dark:bg-white/[0.03]" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border border-gray-200 dark:border-gray-800 ${bg} p-5 shadow-theme-xs`}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Carrousel — Slides du site"
        description="Ajoutez, éditez et supprimez les slides. L'ordre est défini par le numéro d'ordre (0 = premier)."
        actions={
          <button
            id="btn-new-slide"
            type="button"
            onClick={() => setModal(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau slide
          </button>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader />
            <p className="text-sm text-gray-400">Chargement des slides...</p>
          </div>
        ) : slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-4 0v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-600 dark:text-gray-300">Aucun slide pour le moment</p>
              <p className="mt-1 text-sm text-gray-400">Créez votre premier slide pour le carrousel du site.</p>
            </div>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Créer le premier slide
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {slides.map((slide) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                onEdit={() => setModal(slide)}
                onDelete={() => setConfirmId(slide.id)}
                onToggle={() => handleToggle(slide)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Modal create/edit */}
      {mounted && modal !== undefined && (
        <SlideModal
          slide={modal}
          onClose={() => setModal(undefined)}
          onSave={handleSave}
        />
      )}

      {/* Confirm delete */}
      {mounted && confirmId && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-error-100 dark:bg-error-900/20 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-error-600">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Supprimer ce slide</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Le slide sera définitivement supprimé du carrousel.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmId(null)} disabled={deleting}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Annuler
              </button>
              <button type="button" onClick={() => handleDelete(confirmId)} disabled={deleting}
                className="flex-1 rounded-xl bg-error-600 py-2.5 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-60 transition-colors">
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast */}
      {mounted && toast && createPortal(
        <div className={`fixed bottom-6 right-6 z-[99999] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-xl text-sm font-medium border animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === "success"
            ? "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-900/30 text-success-800 dark:text-success-300"
            : "bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-900/30 text-error-800 dark:text-error-300"
        }`}>
          {toast.type === "success"
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          }
          {toast.msg}
        </div>,
        document.body
      )}
    </div>
  );
}
