"use client";

import { IOrganizationSummary } from "@/types/organization.types";
import { useState } from "react";
import { OrganizationDeleteModal } from "./OrganizationDeleteModal";
import { OrganizationEditForm } from "./OrganizationEditForm";

interface OrganizationInfoSectionProps {
  organization: IOrganizationSummary;
}

function InfoValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <p className="break-words text-xs uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p
        title={value || undefined}
        className="mt-2 line-clamp-3 break-words text-sm text-zinc-100 [overflow-wrap:anywhere]"
      >
        {value || "Не указано"}
      </p>
    </div>
  );
}

export function OrganizationInfoSection({
  organization,
}: OrganizationInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <>
      <section className="max-w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:p-8">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Инфо об организации
            </p>
            <h1
              title={organization.name}
              className="mt-3 line-clamp-2 break-words text-3xl font-bold [overflow-wrap:anywhere]"
            >
              {organization.name}
            </h1>
            <p
              title={organization.description || undefined}
              className="mt-4 line-clamp-4 max-w-3xl break-words text-sm leading-6 text-zinc-300 [overflow-wrap:anywhere]"
            >
              {organization.description ||
                "Описание организации пока не добавлено."}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded-xl border border-rose-900/70 bg-rose-950/40 px-5 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-900/50"
            >
              Удалить
            </button>

            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-2 text-sm font-medium transition-colors hover:bg-zinc-800"
            >
              {isEditing ? "Закрыть редактирование" : "Редактировать"}
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-6">
            <OrganizationEditForm
              organization={organization}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : null}

        <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2">
          <InfoValue label="Email" value={organization.owner.email} />
          <InfoValue label="Телефон" value={organization.owner.phone} />
          <InfoValue
            label="Дополнительный контакт"
            value={organization.owner.contact}
          />
          <InfoValue label="Адрес" value={organization.address} />
        </div>
      </section>

      {isDeleteModalOpen ? (
        <OrganizationDeleteModal onClose={() => setIsDeleteModalOpen(false)} />
      ) : null}
    </>
  );
}
