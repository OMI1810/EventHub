"use client";

import { MiniLoader } from "@/components/ui/MiniLoader";
import { ADMIN_PAGES } from "@/config/pages/admin.config";
import eventService from "@/services/event.service";
import { ManagedEventSummary } from "@/types/event-management.types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200">
      {status}
    </span>
  );
}

function EventCard({ event }: { event: ManagedEventSummary }) {
  return (
    <Link
      href={`${ADMIN_PAGES.EVENTS}/${event.idEvent}`}
      className="block rounded-md border border-zinc-800 bg-zinc-900/70 p-5 text-white transition-colors hover:border-primary"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold">{event.title}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {event.organization.name} · {event.type} · {event.format}
          </p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Начало
          </p>
          <p className="mt-1">{formatDate(event.dataStart)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Завершение
          </p>
          <p className="mt-1">{formatDate(event.dataEnd)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Зарегистрировано
          </p>
          <p className="mt-1">{event.registeredUsersCount}</p>
        </div>
      </div>
    </Link>
  );
}

export function AdminEventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "events"],
    queryFn: () => eventService.getMyEvents(),
  });

  const events = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <MiniLoader width={150} height={150} />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Администрирование
          </p>
          <h1 className="mt-2 text-3xl font-bold">Мои мероприятия</h1>
        </div>
        <Link
          href={ADMIN_PAGES.EVENT_CREATE}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Создать мероприятие
        </Link>
      </div>

      {events.length ? (
        <div className="grid gap-4">
          {events.map((event) => (
            <EventCard key={event.idEvent} event={event} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">
            У вас пока нет созданных мероприятий.
          </p>
        </div>
      )}
    </div>
  );
}
