"use client";

import { MiniLoader } from "@/components/ui/MiniLoader";
import eventService from "@/services/event.service";
import {
  CreateManagedEventTurniketData,
  ManagedEventTurniketEntry,
  ManagedEventTurniketOverview,
} from "@/types/event-management.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPersonName(user?: {
  name?: string | null;
  surname?: string | null;
  patronymic?: string | null;
  email?: string | null;
}) {
  const fullName = [user?.surname, user?.name, user?.patronymic]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user?.email || "Без имени";
}

function formatDecision(entry: ManagedEventTurniketEntry) {
  if (entry.decision === "ALLOW") {
    return {
      label: "Пропустить",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    };
  }

  return {
    label: "Не пропускать",
    className: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  };
}

const initialFormState: CreateManagedEventTurniketData = {
  login: "",
  password: "",
  label: "",
};

export function AdminEventTurniketSection({
  eventId,
}: {
  eventId: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialFormState);
  const [createdCredentials, setCreatedCredentials] = useState<{
    login: string;
    password: string;
    label: string;
  } | null>(null);

  const queryKey = ["admin-event-turnikets", eventId];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      eventService
        .getMyEventTurniketsOverview(eventId)
        .then((response) => response.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateManagedEventTurniketData) =>
      eventService.createMyEventTurniket(eventId, payload),
    onSuccess(response) {
      queryClient.setQueryData<ManagedEventTurniketOverview>(
        queryKey,
        response.data.overview,
      );
      setCreatedCredentials({
        login: form.login,
        password: form.password,
        label: form.label,
      });
      setForm(initialFormState);
      toast.success("Турникет создан");
    },
    onError(error: AxiosError<{ message?: string | string[] }>) {
      const message =
        error.response?.data?.message ?? "Не удалось создать турникет";
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (turniketId: string) =>
      eventService.deleteMyEventTurniket(eventId, turniketId),
    onSuccess(response) {
      queryClient.setQueryData<ManagedEventTurniketOverview>(
        queryKey,
        response.data.overview,
      );
      toast.success("Турникет удален");
    },
    onError() {
      toast.error("Не удалось удалить турникет");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      turniketId,
      isActive,
    }: {
      turniketId: string;
      isActive: boolean;
    }) => eventService.updateMyEventTurniketStatus(eventId, turniketId, { isActive }),
    onSuccess(response, variables) {
      queryClient.setQueryData<ManagedEventTurniketOverview>(
        queryKey,
        response.data.overview,
      );
      toast.success(variables.isActive ? "Турникет включен" : "Турникет выключен");
    },
    onError() {
      toast.error("Не удалось изменить состояние турникета");
    },
  });

  const recentEntries = useMemo(() => (data?.entries ?? []).slice(0, 20), [data]);
  const shouldScrollTurnikets = (data?.turnikets.length ?? 0) > 3;
  const shouldScrollEntries = recentEntries.length > 5;

  const updateField = (field: keyof CreateManagedEventTurniketData, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      login: form.login.trim(),
      password: form.password,
      label: form.label.trim(),
    });
  };

  if (isLoading || !data) {
    return (
      <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex min-h-40 items-center justify-center">
          <MiniLoader />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-100">Турникеты и проходы</h2>
        <p className="text-sm text-zinc-400">
          Здесь создаются турникеты именно для этого мероприятия и отображается
          общая статистика по проходам.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Сканирований
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {data.stats.totalScans}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Успешных
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {data.stats.allowedEntries}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Отказов
          </p>
          <p className="mt-2 text-2xl font-semibold text-rose-300">
            {data.stats.deniedEntries}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Уникально вошли
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {data.stats.uniqueParticipants}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-zinc-100">
              Турникеты мероприятия
            </h3>
            <span className="text-sm text-zinc-500">
              Активных: {data.stats.activeTurnikets}
            </span>
          </div>

          {data.turnikets.length ? (
            <div
              className={`space-y-3 pr-1 ${
                shouldScrollTurnikets
                  ? "max-h-[42rem] overflow-y-auto"
                  : ""
              }`}
            >
              {data.turnikets.map((turniket) => (
                <div
                  key={turniket.idTurniket}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-100">
                        {turniket.label}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">
                        Логин: {turniket.login}
                      </p>
                      <p className="mt-1 text-xs">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 ${
                            turniket.isActive
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-zinc-700 bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          {turniket.isActive ? "Включен" : "Выключен"}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Создал: {formatPersonName(turniket.createdByAdmin)} ·{" "}
                        {formatDate(turniket.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Последняя активность: {formatDate(turniket.lastScannedAt)}
                      </p>
                    </div>

                    {data.canManage ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleMutation.mutate({
                              turniketId: turniket.idTurniket,
                              isActive: !turniket.isActive,
                            })
                          }
                          disabled={toggleMutation.isPending}
                          className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-60"
                        >
                          {turniket.isActive ? "Выключить" : "Включить"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(turniket.idTurniket)}
                          disabled={deleteMutation.isPending}
                          className="rounded-md border border-rose-900/60 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/30 disabled:opacity-60"
                        >
                          Удалить
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">Сканирований</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">
                        {turniket.stats.totalScans}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Успешных</p>
                      <p className="mt-1 text-sm font-medium text-emerald-300">
                        {turniket.stats.allowedEntries}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Отказов</p>
                      <p className="mt-1 text-sm font-medium text-rose-300">
                        {turniket.stats.deniedEntries}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Первые входы</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">
                        {turniket.stats.firstSuccessfulEntries}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Для этого мероприятия турникеты пока не созданы.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <h3 className="text-base font-semibold text-zinc-100">
            Создать турникет
          </h3>

          {data.canManage ? (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Название турникета</span>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={(event) => updateField("label", event.target.value)}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-primary"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Логин</span>
                <input
                  type="text"
                  required
                  value={form.login}
                  onChange={(event) => updateField("login", event.target.value)}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-primary"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-300">
                <span>Пароль</span>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-primary"
                />
              </label>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {createMutation.isPending ? "Создаем..." : "Создать"}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              У вас нет прав на управление турникетами этого мероприятия.
            </p>
          )}

          {createdCredentials ? (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-zinc-100">
              <p className="font-medium text-emerald-200">
                Турникет создан. Данные для входа:
              </p>
              <p className="mt-2">Логин: {createdCredentials.login}</p>
              <p>Пароль: {createdCredentials.password}</p>
              <p>Название: {createdCredentials.label}</p>
            </div>
          ) : null}

          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-sm font-medium text-zinc-100">Причины отказов</p>
            <div className="mt-3 grid gap-2 text-sm text-zinc-400">
              <p>Истек срок: {data.stats.denyBreakdown.expired}</p>
              <p>Повторная попытка: {data.stats.denyBreakdown.replay}</p>
              <p>Невалидный код: {data.stats.denyBreakdown.invalid}</p>
              <p>Нет права на проход: {data.stats.denyBreakdown.notEligible}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-100">
            Последние проходы
          </h3>
          <span className="text-sm text-zinc-500">
            Последнее сканирование: {formatDate(data.stats.lastScannedAt)}
          </span>
        </div>

        {recentEntries.length ? (
          <div
            className={`overflow-x-auto ${
              shouldScrollEntries ? "max-h-[24rem] overflow-y-auto pr-1" : ""
            }`}
          >
            <table className="min-w-full text-left text-sm">
              <thead className="text-zinc-500">
                <tr className="border-b border-zinc-800">
                  <th className="px-3 py-2 font-medium">Время</th>
                  <th className="px-3 py-2 font-medium">Участник</th>
                  <th className="px-3 py-2 font-medium">Турникет</th>
                  <th className="px-3 py-2 font-medium">Решение</th>
                  <th className="px-3 py-2 font-medium">Команда</th>
                  <th className="px-3 py-2 font-medium">Кейс</th>
                  <th className="px-3 py-2 font-medium">Детали</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => {
                  const decision = formatDecision(entry);

                  return (
                    <tr
                      key={entry.idEventEntryLog}
                      className="border-b border-zinc-900 align-top"
                    >
                      <td className="px-3 py-3 text-zinc-300">
                        {formatDate(entry.scannedAt)}
                      </td>
                      <td className="px-3 py-3 text-zinc-100">
                        <p>{entry.participantLabel}</p>
                        {entry.participantEmail ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {entry.participantEmail}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">
                        {entry.turniketLabel || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${decision.className}`}
                        >
                          {decision.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-zinc-300">
                        {entry.teamName || "—"}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">
                        {entry.caseTitle || "—"}
                      </td>
                      <td className="px-3 py-3 text-zinc-400">
                        {entry.failureReason ? (
                          <p>{entry.failureReason}</p>
                        ) : entry.wasFirstSuccessfulEntry ? (
                          <p>Первый успешный вход</p>
                        ) : (
                          <p>Повторный проход</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            История проходов для этого мероприятия пока пуста.
          </p>
        )}
      </div>
    </section>
  );
}
