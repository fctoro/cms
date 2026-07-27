"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { SectionCard } from "@/components/common/CmsShared";
import StaffTable from "@/components/club/StaffTable";
import { useClubData } from "@/context/ClubDataContext";
import ExportButton from "@/components/common/ExportButton";

function buildStaffExport(p: any) {
  return {
    "Nom": p.lastName || "",
    "Prénom": p.firstName || "",
    "Rôle": p.role || "",
    "Téléphone": p.telephone || "",
    "Email": p.email || "",
    "Statut": p.statut || "",
    "Date Embauche": p.dateEmbauche ? new Date(p.dateEmbauche).toLocaleDateString("fr-FR") : "",
  };
}

export default function ClubStaffPage() {
  const router = useRouter();
  const { staff, setStaff, hydrated } = useClubData();

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Staff" />

      <SectionCard
        title="Equipe technique"
        description="Ajoutez les nouveaux membres et gardez la liste du staff a jour."
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <ExportButton data={staff.map(buildStaffExport)} filename="staff_club" />
            <Link
              href="/club/staff/nouveau"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              Ajouter un membre
            </Link>
          </div>
        }
      >
        <StaffTable
          staff={staff}
          isLoading={!hydrated}
          onEditStaff={(member) => router.push(`/club/staff/${member.id}/modifier`)}
          onDeleteStaff={async (member) => {
            const response = await fetch(`/api/club/staff/${member.id}`, { method: "DELETE" });
            if (!response.ok) {
              return;
            }
            setStaff((prevStaff) => prevStaff.filter((item) => item.id !== member.id));
          }}
        />
      </SectionCard>
    </div>
  );
}
