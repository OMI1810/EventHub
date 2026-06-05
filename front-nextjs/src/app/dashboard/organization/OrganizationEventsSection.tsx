"use client";

import { EventAdminAccessModal } from "@/app/admin/events/[eventId]/EventAdminAccessModal";
import { MiniLoader } from "@/components/ui/MiniLoader";
import { useOrganization } from "@/hooks/useOrganization";
import { useOrganizationAdmins } from "@/hooks/useOrganizationAdmins";
import { useOrganizationEvents } from "@/hooks/useOrganizationEvents";
import organizationService from "@/services/organization.service";
import { IOrganizationEventSummary } from "@/types/organization.types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { OrganizationCsvExportModal } from "./OrganizationCsvExportModal";

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Moscow",
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
    <span className="max-w-full truncate rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.14em] text-zinc-300">
      {label}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <p className="truncate text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p title={String(value)} className="mt-2 truncate text-sm text-zinc-100">
        {value}
      </p>
    </div>
  );
}

export function OrganizationEventsSection() {
  const { events, isLoading, hasMore, isLoadingMore, loadMore } =
    useOrganizationEvents();
  const { organization } = useOrganization();
  const { admins } = useOrganizationAdmins();
  const [adminEvent, setAdminEvent] =
    useState<IOrganizationEventSummary | null>(null);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { data: csvEventsResponse, isLoading: isCsvEventsLoading } = useQuery({
    queryKey: ["organization", "events", "all"],
    queryFn: () => organizationService.getMyOrganizationEvents(),
    enabled: isCsvOpen,
  });
  const csvEvents = csvEventsResponse?.data ?? [];

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        void loadMore();
      },
      {
        rootMargin: "240px",
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  return (
    <section className="max-w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:p-8">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        Мероприятия организации
      </p>
      <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="break-words text-3xl font-bold [overflow-wrap:anywhere]">
          Список мероприятий
        </h1>
        {organization ? (
          <button
            type="button"
            onClick={() => setIsCsvOpen(true)}
            className="w-full rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800 sm:w-auto"
          >
            Экспорт CSV
          </button>
        ) : null}
      </div>
      <p className="mt-4 max-w-3xl break-words text-sm text-zinc-300 [overflow-wrap:anywhere]">
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
        <div className="mt-6 grid min-w-0 gap-4 xl:grid-cols-2">
          {events.map((event) => (
            <article
              key={event.idEvent}
              className="min-w-0 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {getStatusLabel(event.status)}
                  </p>
                  <h2
                    title={event.title}
                    className="mt-3 line-clamp-2 break-words text-xl font-bold text-zinc-100 [overflow-wrap:anywhere] sm:text-2xl"
                  >
                    {event.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setAdminEvent(event)}
                  className="w-full max-w-full truncate rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-zinc-100 sm:w-auto sm:shrink-0"
                >
                  Администраторы
                </button>
              </div>

              <p
                title={event.description || undefined}
                className="mt-4 line-clamp-2 break-words text-sm text-zinc-400 [overflow-wrap:anywhere]"
              >
                {event.description || "Описание мероприятия пока не добавлено."}
              </p>

              <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                <span className="max-w-full truncate rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.14em] text-zinc-300">
                  {event.type}
                </span>
                <span className="max-w-full truncate rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-emerald-300">
                  {event.format}
                </span>
                <FeatureBadge active={event.hasCases} label="Кейсы" />
                <FeatureBadge active={event.hasTeams} label="Команды" />
                <FeatureBadge active={event.hasMaterials} label="Материалы" />
                <FeatureBadge active={event.hasLoadedSolution} label="Решения" />
                <FeatureBadge active={event.hasResualt} label="Итоги" />
              </div>

              <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Даты"
                  value={formatDateRange(event.dataStart, event.dataEnd)}
                />
                <MetricCard
                  label="Участники"
                  value={event.participantsCount}
                />
                <MetricCard label="Команды" value={event.teamsCount} />
              </div>
            </article>
          ))}
          <div ref={loadMoreRef} className="min-h-1 xl:col-span-2" />
          {isLoadingMore ? (
            <div className="flex justify-center py-4 xl:col-span-2">
              <MiniLoader width={48} height={48} />
            </div>
          ) : null}
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
        isCsvEventsLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <MiniLoader width={80} height={80} />
          </div>
        ) : (
          <OrganizationCsvExportModal
            organization={organization}
            admins={admins}
            events={csvEvents}
            onClose={() => setIsCsvOpen(false)}
          />
        )
      ) : null}
    </section>
  );
}
