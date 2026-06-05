"use client";

import { MiniLoader } from "@/components/ui/MiniLoader";
import { ADMIN_PAGES } from "@/config/pages/admin.config";
import eventService from "@/services/event.service";
import { ManagedEventSummary } from "@/types/event-management.types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

type EventFilter =
  | "ALL"
  | "PUBLISHED"
  | "PRIVATE"
  | "FINISHED"
  | "OFFLINE"
  | "ONLINE"
  | "ENTRY_PASS";

const EVENT_FILTERS: Array<{ id: EventFilter; label: string }> = [
  { id: "ALL", label: "Все" },
  { id: "PUBLISHED", label: "Опубликованные" },
  { id: "PRIVATE", label: "Приватные" },
  { id: "FINISHED", label: "Завершённые" },
  { id: "OFFLINE", label: "Офлайн" },
  { id: "ONLINE", label: "Онлайн" },
  { id: "ENTRY_PASS", label: "С QR-пропуском" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "Опубликовано";
    case "PRIVATE":
      return "Приватное";
    case "FINISHED":
      return "Завершено";
    default:
      return status;
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "PRIVATE":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "FINISHED":
      return "border-zinc-600 bg-zinc-800 text-zinc-300";
    default:
      return "border-zinc-700 bg-zinc-950 text-zinc-200";
  }
}

function matchesFilter(event: ManagedEventSummary, activeFilter: EventFilter) {
  switch (activeFilter) {
    case "PUBLISHED":
      return event.status === "PUBLISHED";
    case "PRIVATE":
      return event.status === "PRIVATE";
    case "FINISHED":
      return event.status === "FINISHED";
    case "OFFLINE":
      return event.format === "OFFLINE";
    case "ONLINE":
      return event.format === "ONLINE";
    case "ENTRY_PASS":
      return event.hasEntryPass;
    default:
      return true;
  }
}

function SummaryCard({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: number;
  accent?: "default" | "green" | "amber";
}) {
  const accentClass =
    accent === "green"
      ? "text-emerald-300"
      : accent === "amber"
        ? "text-amber-200"
        : "text-zinc-100";

  return (
    <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 sm:text-[11px] sm:tracking-[0.22em]">
        {label}
      </p>
      <p className={`mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl ${accentClass}`}>
        {value}
      </p>
    </div>
  );
}

function EventMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-100">{value}</p>
    </div>
  );
}

function EventCard({ event }: { event: ManagedEventSummary }) {
  return (
    <Link
      href={`${ADMIN_PAGES.EVENTS}/${event.idEvent}`}
      className="group block rounded-3xl border border-zinc-800 bg-zinc-900/70 text-white transition-all hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              {event.organization.name}
            </p>
            <h2 className="mt-3 line-clamp-2 text-xl font-semibold text-zinc-50 transition-colors group-hover:text-white sm:text-2xl">
              {event.title}
            </h2>
          </div>

          <span
            className={`inline-flex shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusStyles(event.status)}`}
          >
            {getStatusLabel(event.status)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-400">
          <span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5">
            {event.type}
          </span>
          <span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5">
            {event.format}
          </span>
          {event.hasEntryPass ? (
            <span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5">
              QR-пропуск
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <EventMetric label="Начало" value={formatDate(event.dataStart)} />
          <EventMetric label="Завершение" value={formatDate(event.dataEnd)} />
          <EventMetric
            label="Зарегистрировано"
            value={event.registeredUsersCount}
          />
        </div>
      </div>
    </Link>
  );
}

export function AdminEventsPage() {
  const [activeFilter, setActiveFilter] = useState<EventFilter>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "events"],
    queryFn: () => eventService.getMyEvents(),
  });

  const events = data?.data ?? [];
  const filteredEvents = events.filter((event) =>
    matchesFilter(event, activeFilter),
  );
  const publishedCount = events.filter(
    (event) => event.status === "PUBLISHED",
  ).length;
  const privateCount = events.filter(
    (event) => event.status === "PRIVATE",
  ).length;
  const finishedCount = events.filter(
    (event) => event.status === "FINISHED",
  ).length;

  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <MiniLoader width={150} height={150} />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 w-full gap-6 text-white">
      <section className="min-w-0 overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/90">
        <div className="p-4 sm:p-5 md:p-7 xl:p-8">
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 max-w-5xl">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                Администрирование
              </p>
              <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                Мои мероприятия
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-6 text-zinc-400">
                Здесь собраны все мероприятия, к которым у вас есть доступ как у
                администратора. Выберите нужное событие, чтобы перейти к
                управлению командами, кейсами, материалами, результатами и
                правами.
              </p>
            </div>

            <Link
              href={ADMIN_PAGES.EVENT_CREATE}
              className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 sm:w-auto"
            >
              Создать мероприятие
            </Link>
          </div>

          <div className="mt-6 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Всего мероприятий" value={events.length} />
            <SummaryCard
              label="Опубликованных"
              value={publishedCount}
              accent="green"
            />
            <SummaryCard
              label="Приватных"
              value={privateCount}
              accent="amber"
            />
            <SummaryCard label="Завершённых" value={finishedCount} />
          </div>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-3 whitespace-nowrap">
            {EVENT_FILTERS.map((filter) => {
              const isActive = filter.id === activeFilter;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? "border-emerald-500/50 bg-emerald-500/12 text-emerald-200"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {filteredEvents.length ? (
        <div className="grid min-w-0 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.idEvent} event={event} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            Пустой результат
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-zinc-100">
            По выбранному фильтру мероприятий нет
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Попробуйте переключить фильтр или создайте новое мероприятие, если
            хотите начать работу с новым событием.
          </p>
        </div>
      )}
    </div>
  );
}
