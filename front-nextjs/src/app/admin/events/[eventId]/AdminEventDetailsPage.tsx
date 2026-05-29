"use client";

import { MiniLoader } from "@/components/ui/MiniLoader";
import { ADMIN_PAGES } from "@/config/pages/admin.config";
import eventService from "@/services/event.service";
import {
  EventInviteResponse,
  ManagedEventDetails,
  UpdateManagedEventGeneralData,
} from "@/types/event-management.types";
import { EventFormat, EventPublicationStatus } from "@/types/event-create.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { ReactNode, useEffect, useState } from "react";
import toast from "react-hot-toast";

function formatDate(value?: string | null) {
  if (!value) return "Не указано";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toInputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toPublicationStatus(status: string): EventPublicationStatus {
  return status === "PRIVATE" ? "PRIVATE" : "PUBLIC";
}

function formatInviteExpiry(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DetailPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-200"
        >
          Подробнее
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ConfirmFinishModal({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-950 p-5 text-white">
        <h2 className="text-xl font-semibold">Завершить мероприятие</h2>
        <p className="mt-4 text-sm text-zinc-300">
          Вы уверены что хотите досрочно завершить мероприятие?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm"
          >
            Нет
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium"
          >
            Да
          </button>
        </div>
      </div>
    </div>
  );
}

function EventInviteQrModal({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    QRCode.toDataURL(code, {
      width: 320,
      margin: 2,
      color: {
        dark: "#111827",
        light: "#FFFFFF",
      },
    })
      .then((url: string) => {
        if (isMounted) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (isMounted) {
          setQrDataUrl(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [code]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-950 p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              QR приглашения
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Код приглашения на мероприятие
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400">
            Закрыть
          </button>
        </div>

        <div className="mt-5 rounded-md border border-zinc-800 bg-white p-5">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Event invite QR"
              className="mx-auto block h-auto max-w-full"
            />
          ) : (
            <div className="flex min-h-72 items-center justify-center text-sm text-zinc-500">
              Не удалось сформировать QR-код
            </div>
          )}
        </div>

        <div className="mt-5 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Код
          </p>
          <p className="mt-2 font-mono text-xl font-bold tracking-[0.2em] text-emerald-400">
            {code}
          </p>
        </div>
      </div>
    </div>
  );
}

function EventInviteSection({ eventId }: { eventId: string }) {
  const [invite, setInvite] = useState<EventInviteResponse | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const { mutate: createInvite, isPending } = useMutation({
    mutationKey: ["admin", "events", eventId, "invite"],
    mutationFn: () => eventService.createMyEventInvite(eventId),
    onSuccess(response) {
      setInvite(response.data);
      toast.success("Код приглашения создан");
    },
    onError() {
      toast.error("Не удалось создать код приглашения");
    },
  });

  const copyInvite = async () => {
    if (!invite) return;

    await navigator.clipboard.writeText(invite.code);
    toast.success("Код скопирован");
  };

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Система приглашения</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Сгенерируйте временный код для приглашения участников на это
            мероприятие. Новый код заменит предыдущий активный код.
          </p>
        </div>
        <button
          type="button"
          onClick={() => createInvite()}
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {invite ? "Обновить код" : "Создать код"}
        </button>
      </div>

      {invite ? (
        <div className="mt-5 grid gap-4 rounded-md border border-zinc-800 bg-zinc-950/70 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Код приглашения
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-[0.2em] text-emerald-400">
              {invite.code}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Действует до {formatInviteExpiry(invite.expiresAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyInvite}
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200"
            >
              Скопировать
            </button>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200"
            >
              QR-код
            </button>
          </div>
        </div>
      ) : null}

      {isQrModalOpen && invite ? (
        <EventInviteQrModal
          code={invite.code}
          onClose={() => setIsQrModalOpen(false)}
        />
      ) : null}
    </section>
  );
}

type EditMode = "general" | "cases" | "teams" | "materials";

function EditEventModal({
  event,
  onClose,
}: {
  event: ManagedEventDetails;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<EditMode>("general");
  const [form, setForm] = useState<UpdateManagedEventGeneralData>({
    title: event.title,
    description: event.description ?? "",
    slug: event.slug,
    dataStart: toInputDate(event.dataStart),
    dataEnd: toInputDate(event.dataEnd),
    status: toPublicationStatus(event.status),
    dataStartRegistration: toInputDate(event.dataStartRegistration),
    dataEndRegistration: toInputDate(event.dataEndRegistration),
    format: event.format,
    address: event.address,
    cordinatX: event.cordinatX ?? undefined,
    cordinatY: event.cordinatY ?? undefined,
  });

  const update = (field: keyof UpdateManagedEventGeneralData, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      dataStartRegistration:
        field === "status" && value === "PRIVATE"
          ? ""
          : current.dataStartRegistration,
      dataEndRegistration:
        field === "status" && value === "PRIVATE"
          ? ""
          : current.dataEndRegistration,
    }));
  };

  const { mutate: mutateUpdate, isPending } = useMutation({
    mutationKey: ["admin", "events", event.idEvent, "update"],
    mutationFn: () => eventService.updateMyEventGeneral(event.idEvent, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "events", event.idEvent],
      });
      toast.success("Мероприятие обновлено");
      onClose();
    },
    onError() {
      toast.error("Не удалось обновить мероприятие");
    },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-md border border-zinc-700 bg-zinc-950 p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Редактирование мероприятия</h2>
          <button type="button" onClick={onClose} className="text-zinc-400">
            Закрыть
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("general")}
            className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
          >
            Общие данные
          </button>
          {event.hasCases ? (
            <button
              type="button"
              onClick={() => setMode("cases")}
              className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
            >
              Настройки кейсов
            </button>
          ) : null}
          {event.hasTeams ? (
            <button
              type="button"
              onClick={() => setMode("teams")}
              className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
            >
              Настройки команд
            </button>
          ) : null}
          {event.hasMaterials ? (
            <button
              type="button"
              onClick={() => setMode("materials")}
              className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
            >
              Материалы
            </button>
          ) : null}
        </div>

        {mode === "general" ? (
          <div className="mt-5 grid max-h-[70vh] gap-4 overflow-y-auto pr-2 md:grid-cols-2">
            <TextField label="Название" value={form.title} onChange={(v) => update("title", v)} />
            <TextField label="Slug" value={form.slug} onChange={(v) => update("slug", v)} />
            <div className="md:col-span-2">
              <TextAreaField
                label="Описание"
                value={form.description ?? ""}
                onChange={(v) => update("description", v)}
              />
            </div>
            <SelectField
              label="Статус"
              value={form.status}
              onChange={(v) => update("status", v)}
            >
              <option value="PRIVATE">Приватное</option>
              <option value="PUBLIC">Публичное</option>
            </SelectField>
            <SelectField
              label="Формат"
              value={form.format}
              onChange={(v) => update("format", v)}
            >
              <option value="OFFLINE">Офлайн</option>
              <option value="ONLINE">Онлайн</option>
              <option value="HYBRID">Гибрид</option>
            </SelectField>
            <TextField
              label="Дата начала"
              type="datetime-local"
              value={form.dataStart}
              onChange={(v) => update("dataStart", v)}
            />
            <TextField
              label="Дата завершения"
              type="datetime-local"
              value={form.dataEnd}
              onChange={(v) => update("dataEnd", v)}
            />
            {form.status === "PUBLIC" ? (
              <>
                <TextField
                  label="Начало регистрации"
                  type="datetime-local"
                  value={form.dataStartRegistration ?? ""}
                  onChange={(v) => update("dataStartRegistration", v)}
                />
                <TextField
                  label="Конец регистрации"
                  type="datetime-local"
                  value={form.dataEndRegistration ?? ""}
                  onChange={(v) => update("dataEndRegistration", v)}
                />
              </>
            ) : null}
            {form.format !== "ONLINE" ? (
              <div className="md:col-span-2">
                <TextField
                  label="Адрес"
                  value={form.address}
                  onChange={(v) => update("address", v)}
                />
              </div>
            ) : null}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => mutateUpdate()}
                disabled={isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium"
              >
                Сохранить
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="text-lg font-semibold">
              {mode === "cases"
                ? "Настройки кейсов"
                : mode === "teams"
                  ? "Настройки команд"
                  : "Материалы"}
            </h3>
            <p className="mt-3 text-sm text-zinc-400">
              Раздел подготовлен для перехода между настройками. Редактирование
              этого блока будет добавлено отдельно.
            </p>
            <button
              type="button"
              onClick={() => setMode("general")}
              className="mt-4 rounded-md border border-zinc-700 px-3 py-2 text-sm"
            >
              Назад к общим данным
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TextField({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      {label}
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
      />
    </label>
  );
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
      >
        {children}
      </select>
    </label>
  );
}

export function AdminEventDetailsPage() {
  const params = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "events", params.eventId],
    queryFn: () => eventService.getMyEventDetails(params.eventId),
    enabled: Boolean(params.eventId),
  });

  const event = data?.data ?? null;

  const { mutate: mutateFinish, isPending: isFinishPending } = useMutation({
    mutationKey: ["admin", "events", params.eventId, "finish"],
    mutationFn: () => eventService.finishMyEvent(params.eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "events", params.eventId],
      });
      toast.success("Мероприятие завершено");
      setIsFinishModalOpen(false);
    },
    onError() {
      toast.error("Не удалось завершить мероприятие");
    },
  });

  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <MiniLoader width={150} height={150} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl rounded-md border border-zinc-800 bg-zinc-900 p-6 text-white">
        Мероприятие не найдено.
      </div>
    );
  }

  if (event.status === "FINISHED") {
    return (
      <div className="mx-auto grid max-w-4xl gap-6 text-white">
        <div>
          <Link href={ADMIN_PAGES.EVENTS} className="text-sm text-primary">
            Назад к мероприятиям
          </Link>
          <section className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Статус
            </p>
            <h1 className="mt-3 text-3xl font-bold">Мероприятие завершено</h1>
            <p className="mt-3 text-sm text-zinc-400">
              {event.title} больше нельзя редактировать. Данные доступны только
              для просмотра.
            </p>
          </section>
        </div>

        <section className="grid gap-4 rounded-md border border-zinc-800 bg-zinc-900/70 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Зарегистрировано
            </p>
            <p className="mt-2 text-lg font-semibold">
              {event.registeredUsersCount}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Начало
            </p>
            <p className="mt-2 text-sm">{formatDate(event.dataStart)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Завершение
            </p>
            <p className="mt-2 text-sm">{formatDate(event.dataEnd)}</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href={ADMIN_PAGES.EVENTS} className="text-sm text-primary">
            Назад к мероприятиям
          </Link>
          <h1 className="mt-3 text-3xl font-bold">{event.title}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {event.type} · {event.organization.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium"
        >
          Редактировать
        </button>
      </div>

      <section className="grid gap-4 rounded-md border border-zinc-800 bg-zinc-900/70 p-5 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Статус
          </p>
          <p className="mt-2 text-lg font-semibold">{event.status}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Зарегистрировано
          </p>
          <p className="mt-2 text-lg font-semibold">
            {event.registeredUsersCount}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Начало
          </p>
          <p className="mt-2 text-sm">{formatDate(event.dataStart)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Завершение
          </p>
          <p className="mt-2 text-sm">{formatDate(event.dataEnd)}</p>
        </div>
      </section>

      <EventInviteSection eventId={event.idEvent} />

      {event.hasTeams ? (
        <DetailPanel title="Команды">
          {event.teams.length ? (
            <div className="grid gap-3">
              {event.teams.map((team) => (
                <div key={team.idTeam} className="rounded-md border border-zinc-800 p-3">
                  <p className="font-medium">{team.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Участников: {team.membersCount}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Команды пока не созданы.</p>
          )}
        </DetailPanel>
      ) : null}

      {event.hasCases ? (
        <DetailPanel title="Кейсы">
          {event.cases.length ? (
            <div className="grid gap-3">
              {event.cases.map((eventCase) => (
                <div key={eventCase.idCase} className="rounded-md border border-zinc-800 p-3">
                  <p className="font-medium">{eventCase.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {eventCase.holder || "Кейсодержатель не указан"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Кейсы пока не добавлены.</p>
          )}
        </DetailPanel>
      ) : null}

      {event.hasMaterials ? (
        <DetailPanel title="Материалы">
          {event.materials.length ? (
            <div className="grid gap-3">
              {event.materials.map((material) => (
                <div key={material.idMaterial} className="rounded-md border border-zinc-800 p-3">
                  <p className="font-medium">{material.title}</p>
                  <p className="mt-1 truncate text-sm text-zinc-400">
                    {material.url}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Материалы пока не добавлены.</p>
          )}
        </DetailPanel>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsFinishModalOpen(true)}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium"
        >
          Завершить мероприятие
        </button>
      </div>

      {isEditModalOpen ? (
        <EditEventModal
          event={event}
          onClose={() => setIsEditModalOpen(false)}
        />
      ) : null}

      {isFinishModalOpen ? (
        <ConfirmFinishModal
          isPending={isFinishPending}
          onClose={() => setIsFinishModalOpen(false)}
          onConfirm={() => mutateFinish()}
        />
      ) : null}
    </div>
  );
}
