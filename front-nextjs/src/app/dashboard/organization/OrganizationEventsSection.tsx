"use client";

import { EventAdminAccessModal } from "@/app/admin/events/[eventId]/EventAdminAccessModal";
import { MiniLoader } from "@/components/ui/MiniLoader";
import { useOrganization } from "@/hooks/useOrganization";
import { useOrganizationAdmins } from "@/hooks/useOrganizationAdmins";
import { useOrganizationEvents } from "@/hooks/useOrganizationEvents";
import { IOrganizationEventSummary } from "@/types/organization.types";
import { useState } from "react";
import { OrganizationCsvExportModal } from "./OrganizationCsvExportModal";

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function getStatusLabel(status: IOrganizationEventSummary["status"]) {
  switch (status) {
    case "PRIVATE":
      return "Приватное";
    case "FINISHED":
      return "Завершено";
    case "PUBLISHED":
    default:
      return "Опубликовано";
  }
}

function FeatureBadge({ active, label }: { active: boolean; label: string }) {
  if (!active) return null;

  return (
    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300">
      {label}
    </span>
  );
}

export function OrganizationEventsSection() {
  const { events, isLoading } = useOrganizationEvents();
  const { organization } = useOrganization();
  const { admins } = useOrganizationAdmins();
  const [adminEvent, setAdminEvent] =
    useState<IOrganizationEventSummary | null>(null);
  const [isCsvOpen, setIsCsvOpen] = useState(false);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        Мероприятия организации
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Список мероприятий</h1>
        {organization ? (
          <button
            type="button"
            onClick={() => setIsCsvOpen(true)}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
          >
            Экспорт CSV
          </button>
        ) : null}
      </div>
      <p className="mt-4 max-w-3xl text-sm text-zinc-300">
        Здесь отображаются все мероприятия, созданные от имени этой организации.
      </p>

      {isLoading ? (
        <div className="mt-6">
          <MiniLoader width={80} height={80} />
        </div>
      ) : events.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 px-5 py-6 text-sm text-zinc-500">
          У этой организации пока нет мероприятий.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {events.map((event) => (
            <article
              key={event.idEvent}
              className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {getStatusLabel(event.status)}
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-zinc-100">
                    {event.title}
                  </h2>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    {event.format}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdminEvent(event)}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-primary hover:text-primary"
                  >
                    Администраторы
                  </button>
                </div>
              </div>

              <p className="mt-4 text-sm text-zinc-400">
                {event.description ||
                  "Описание мероприятия пока не добавлено."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300">
                  {event.type}
                </span>
                <FeatureBadge active={event.hasCases} label="Кейсы" />
                <FeatureBadge active={event.hasTeams} label="Команды" />
                <FeatureBadge active={event.hasMaterials} label="Материалы" />
                <FeatureBadge
                  active={event.hasLoadedSolution}
                  label="Решения"
                />
                <FeatureBadge active={event.hasResualt} label="Итоги" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Даты
                  </p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {formatDateRange(event.dataStart, event.dataEnd)}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Участники
                  </p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {event.participantsCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Команды
                  </p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {event.teamsCount}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {adminEvent ? (
        <EventAdminAccessModal
          eventId={adminEvent.idEvent}
          eventStatus={adminEvent.status}
          onClose={() => setAdminEvent(null)}
        />
      ) : null}
      {isCsvOpen && organization ? (
        <OrganizationCsvExportModal
          organization={organization}
          admins={admins}
          events={events}
          onClose={() => setIsCsvOpen(false)}
        />
      ) : null}
    </section>
  );
}
