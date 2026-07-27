"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SectionCard } from "@/components/common/CmsShared";
import PlayerTable from "@/components/club/PlayerTable";
import { useClubData } from "@/context/ClubDataContext";
import ExportButton from "@/components/common/ExportButton";

function buildPlayerExport(p: any) {
  return {
    "Nom": p.lastName || "",
    "Prénom": p.firstName || "",
    "Catégorie": p.categorie || "",
    "Poste": p.poste || "",
    "Sexe": p.sexe || "",
    "Date de naissance": p.dateNaissance ? new Date(p.dateNaissance).toLocaleDateString("fr-FR") : "",
    "Téléphone": p.telephone || "",
    "Email": p.email || "",
    "Statut": p.statut || "",
    "Statut Cotisation": p.cotisationStatut || "",
    "Montant Cotisation": p.cotisationMontant ? String(p.cotisationMontant) : "",
    "Date Inscription": p.dateInscription ? new Date(p.dateInscription).toLocaleDateString("fr-FR") : "",
  };
}

export default function ClubPlayersPage() {
  const router = useRouter();
  const { players, setPlayers, hydrated } = useClubData();

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Joueurs" />

      <SectionCard
        title="Effectif du club"
        description="Ajoutez, modifiez et suivez les joueurs relies a la base de donnees."
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <ExportButton data={players.map(buildPlayerExport)} filename="joueurs_club" />
            <Link
              href="/club/joueurs/nouveau"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              Ajouter un joueur
            </Link>
          </div>
        }
      >
        <PlayerTable
          players={players}
          isLoading={!hydrated}
          onEditPlayer={(player) => router.push(`/club/joueurs/${player.id}/modifier`)}
          onDeletePlayer={async (player) => {
            const response = await fetch(`/api/club/players/${player.id}`, { method: "DELETE" });
            if (!response.ok) {
              return;
            }
            setPlayers((prevPlayers) =>
              prevPlayers.filter((item) => item.id !== player.id),
            );
          }}
        />
      </SectionCard>
    </div>
  );
}
