"use client";

import { InviteQrModal } from "@/app/invites/components/InviteQrModal";
import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { MiniLoader } from "@/components/ui/MiniLoader";
import { ADMIN_PAGES } from "@/config/pages/admin.config";
import eventService from "@/services/event.service";
import { EventTagDraft, EventTagOption } from "@/types/event-create.types";
import {
  EventInviteResponse,
  ManagedEventCase,
  ManagedEventDetails,
  ManagedEventMaterial,
  ManagedEventSolution,
  ManagedEventTeam,
  UpdateManagedEventCaseData,
  UpdateManagedEventGeneralData,
  UpdateManagedEventResultItemData,
} from "@/types/event-management.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AdminEventCsvExportModal } from "./AdminEventCsvExportModal";

const ArcGisPointMap = dynamic(
  () =>
    import("@/components/map/ArcGisPointMap").then(
      (module) => module.ArcGisPointMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-md border border-zinc-700 bg-zinc-950" />
    ),
  },
);

interface EventMaterialForm {
  idMaterial?: string;
  title: string;
  url: string;
}

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
}

function formatDate(value?: string | null) {
  if (!value) return "Не указано";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toDateTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function formatPersonName(user?: {
  name?: string | null;
  surname?: string | null;
  patronymic?: string | null;
}) {
  const name = [user?.surname, user?.name, user?.patronymic]
    .filter(Boolean)
    .join(" ");

  return name || "Без имени";
}

function isCaptain(team: ManagedEventTeam, userId: string) {
  return team.caption?.idUser === userId;
}

function normalizeTagName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function tagsToDrafts(tags: EventTagOption[]): EventTagDraft[] {
  return tags.map((tag) => ({
    id: tag.idTag || undefined,
    name: tag.name,
  }));
}

function caseToPayload(
  eventCase: ManagedEventCase,
): UpdateManagedEventCaseData {
  return {
    idCase: eventCase.idCase,
    title: eventCase.title,
    description: eventCase.description ?? undefined,
    holder: eventCase.holder ?? undefined,
    teamLimit: eventCase.teamLimit ?? undefined,
    dateForStartSelected: eventCase.dateForStartSelected ?? undefined,
    dateForEndSelected: eventCase.dateForEndSelected ?? undefined,
    dateStopCode: eventCase.dateStopCode ?? undefined,
    isOpen: eventCase.isOpen,
    tags: tagsToDrafts(eventCase.tags ?? []),
    materials: (eventCase.materials ?? []).map((material) => ({
      idMaterial: material.idMaterial,
      title: material.title,
      url: material.url,
    })),
  };
}

function getTargetKey(target: { teamId?: string; userId?: string }) {
  return target.teamId ? `team:${target.teamId}` : `user:${target.userId}`;
}

function getResultPlace(
  event: ManagedEventDetails,
  target: { caseId?: string | null; teamId?: string; userId?: string },
) {
  const result = event.results.find((eventResult) => {
    const isSameCase = (eventResult.caseId ?? null) === (target.caseId ?? null);
    const isSameTeam = target.teamId
      ? eventResult.teamId === target.teamId
      : true;
    const isSameUser = target.userId
      ? eventResult.userId === target.userId
      : true;

    return isSameCase && isSameTeam && isSameUser;
  });

  return result?.place?.toString() ?? "";
}

function getDuplicatePlaces(places: Record<string, string>) {
  const seenPlaces = new Set<number>();
  const duplicatePlaces = new Set<number>();

  Object.values(places).forEach((value) => {
    const place = Number(value);
    if (!Number.isInteger(place) || place < 1) return;

    if (seenPlaces.has(place)) {
      duplicatePlaces.add(place);
      return;
    }

    seenPlaces.add(place);
  });

  return duplicatePlaces;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function buildResultPayload(
  places: Record<string, string>,
  targets: Array<{ caseId?: string | null; teamId?: string; userId?: string }>,
): UpdateManagedEventResultItemData[] {
  return targets.map((target) => {
    const value = places[getTargetKey(target)] ?? "";
    const place = Number(value);

    return {
      ...target,
      place: Number.isInteger(place) && place > 0 ? place : null,
    };
  });
}

function Modal({ title, children, onClose, footer, wide }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`max-h-[90vh] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl ${
          wide ? "w-full max-w-4xl" : "w-full max-w-2xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            x
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-3 border-t border-zinc-800 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DetailPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-zinc-800 bg-zinc-950 p-5 ${className ?? ""}`}
    >
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-zinc-500">{label}</p>
      <div className="mt-1 text-sm text-zinc-100">{value}</div>
    </div>
  );
}

function SolutionStatus({
  solution,
  onOpen,
}: {
  solution?: ManagedEventSolution | null;
  onOpen: (solution: ManagedEventSolution) => void;
}) {
  if (!solution) {
    return <p className="mt-2 text-sm text-zinc-500">Решение не загружено</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <span className="text-sm text-emerald-300">
        Решение загружено: {formatDate(solution.updateAt)}
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(solution);
        }}
        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-900"
      >
        Подробнее
      </button>
    </div>
  );
}

function SolutionDetailsModal({
  solution,
  onClose,
}: {
  solution: ManagedEventSolution;
  onClose: () => void;
}) {
  return (
    <Modal title="Загруженное решение" onClose={onClose}>
      <div className="space-y-4">
        <InfoRow label="Дата загрузки" value={formatDate(solution.updateAt)} />
        <InfoRow
          label="Описание"
          value={solution.description || "Описание не указано"}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <a
            href={solution.urlSolution}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-primary hover:border-primary/60"
          >
            Открыть решение
          </a>
          <a
            href={solution.urlPresentation}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-primary hover:border-primary/60"
          >
            Открыть презентацию
          </a>
        </div>
      </div>
    </Modal>
  );
}

function EventInviteSection({ eventId }: { eventId: string }) {
  const [invite, setInvite] = useState<EventInviteResponse | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const createInviteMutation = useMutation({
    mutationFn: () => eventService.createMyEventInvite(eventId),
    onSuccess: (response) => {
      setInvite(response.data);
      setIsQrOpen(false);
      toast.success("Код приглашения создан");
    },
    onError: () => toast.error("Не удалось создать код приглашения"),
  });

  return (
    <DetailPanel title="Система приглашения">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => createInviteMutation.mutate()}
          disabled={createInviteMutation.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {createInviteMutation.isPending ? "Создание..." : "Создать код"}
        </button>

        {invite ? (
          <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-900/60 p-4">
            <InfoRow label="Код" value={invite.code} />
            <InfoRow
              label="Действует до"
              value={formatDate(invite.expiresAt)}
            />

            <button
              type="button"
              onClick={() => setIsQrOpen(true)}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
            >
              Показать QR
            </button>
          </div>
        ) : null}
      </div>

      {invite && isQrOpen ? (
        <InviteQrModal
          label="Приглашение"
          title="QR-код приглашения"
          code={invite.code}
          onClose={() => setIsQrOpen(false)}
        />
      ) : null}
    </DetailPanel>
  );
}

function TagSelector({
  value,
  options,
  onChange,
}: {
  value: EventTagOption[];
  options: EventTagOption[];
  onChange: (tags: EventTagOption[]) => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeTagName(query).toLowerCase();
  const filteredOptions = options.filter((tag) => {
    const isSelected = value.some(
      (selectedTag) => selectedTag.name === tag.name,
    );
    return (
      !isSelected &&
      (!normalizedQuery || tag.name.toLowerCase().includes(normalizedQuery))
    );
  });

  const addTag = (tag: EventTagOption) => {
    onChange([...value, tag]);
    setQuery("");
  };

  const addCustomTag = () => {
    const name = normalizeTagName(query);
    if (
      !name ||
      value.some((tag) => tag.name.toLowerCase() === name.toLowerCase())
    ) {
      return;
    }

    const existingTag = options.find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );

    addTag(existingTag ?? { idTag: "", name, type: "CUSTOM" });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Введите тег"
          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="h-10 w-10 rounded-md border border-zinc-700 text-lg text-zinc-100 hover:bg-zinc-900"
        >
          +
        </button>
      </div>

      {query && filteredOptions.length > 0 ? (
        <div className="max-h-36 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950">
          {filteredOptions.map((tag) => (
            <button
              key={tag.idTag ?? tag.name}
              type="button"
              onClick={() => addTag(tag)}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-900"
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <button
            key={tag.idTag ?? tag.name}
            type="button"
            onClick={() =>
              onChange(
                value.filter((selectedTag) => selectedTag.name !== tag.name),
              )
            }
            className="rounded-full border border-primary/50 px-3 py-1 text-sm text-primary hover:bg-primary/10"
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditEventModal({
  event,
  onClose,
}: {
  event: ManagedEventDetails;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpdateManagedEventGeneralData>({
    title: event.title,
    description: event.description ?? undefined,
    slug: event.slug,
    format: event.format,
    address: event.address ?? "",
    cordinatX: event.cordinatX ?? undefined,
    cordinatY: event.cordinatY ?? undefined,
    dataStart: toDateTimeInput(event.dataStart),
    dataEnd: toDateTimeInput(event.dataEnd),
    status: event.status === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    dataStartRegistration: toDateTimeInput(event.dataStartRegistration),
    dataEndRegistration: toDateTimeInput(event.dataEndRegistration),
  });
  const [materials, setMaterials] = useState<EventMaterialForm[]>(
    event.materials.map((material) => ({
      idMaterial: material.idMaterial,
      title: material.title,
      url: material.url,
    })),
  );
  const [materialDraft, setMaterialDraft] = useState<EventMaterialForm>({
    title: "",
    url: "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await eventService.updateMyEventGeneral(event.idEvent, {
        ...form,
        dataStart: toIsoDate(form.dataStart) ?? "",
        dataEnd: toIsoDate(form.dataEnd) ?? "",
        dataStartRegistration: toIsoDate(form.dataStartRegistration ?? ""),
        dataEndRegistration: toIsoDate(form.dataEndRegistration ?? ""),
      });

      if (event.hasMaterials) {
        await eventService.updateMyEventMaterials(event.idEvent, {
          materials: materials
            .filter((material) => material.title.trim() && material.url.trim())
            .map((material) => ({
              idMaterial: material.idMaterial,
              title: material.title.trim(),
              url: material.url.trim(),
            })),
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-event", event.idEvent],
      });
      toast.success("Мероприятие обновлено");
      onClose();
    },
    onError: () => toast.error("Не удалось обновить мероприятие"),
  });

  const addMaterial = () => {
    if (!materialDraft.title.trim() || !materialDraft.url.trim()) return;
    setMaterials((currentMaterials) => [
      ...currentMaterials,
      { title: materialDraft.title.trim(), url: materialDraft.url.trim() },
    ]);
    setMaterialDraft({ title: "", url: "" });
  };

  return (
    <Modal
      title="Редактирование мероприятия"
      onClose={onClose}
      wide
      footer={
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-zinc-400">Название</span>
            <input
              value={form.title ?? ""}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  title: event.target.value,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-zinc-400">Описание</span>
            <textarea
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-zinc-400">Начало</span>
            <input
              type="datetime-local"
              value={form.dataStart ?? ""}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  dataStart: event.target.value,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-zinc-400">Окончание</span>
            <input
              type="datetime-local"
              value={form.dataEnd ?? ""}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  dataEnd: event.target.value,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-zinc-400">Статус публикации</span>
            <select
              value={form.status ?? "PRIVATE"}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  status: event.target.value as "PRIVATE" | "PUBLIC",
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            >
              <option value="PRIVATE">PRIVATE</option>
              <option value="PUBLIC">PUBLIC</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-zinc-400">Формат</span>
            <select
              value={form.format}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  format: event.target
                    .value as UpdateManagedEventGeneralData["format"],
                  address:
                    event.target.value === "ONLINE" ? "" : currentForm.address,
                  cordinatX:
                    event.target.value === "ONLINE"
                      ? undefined
                      : currentForm.cordinatX,
                  cordinatY:
                    event.target.value === "ONLINE"
                      ? undefined
                      : currentForm.cordinatY,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            >
              <option value="OFFLINE">OFFLINE</option>
              <option value="ONLINE">ONLINE</option>
              <option value="HYBRID">HYBRID</option>
            </select>
          </label>
          {form.status === "PUBLIC" ? (
            <>
              <label className="space-y-2">
                <span className="text-sm text-zinc-400">Старт регистрации</span>
                <input
                  type="datetime-local"
                  value={form.dataStartRegistration ?? ""}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      dataStartRegistration: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-zinc-400">Конец регистрации</span>
                <input
                  type="datetime-local"
                  value={form.dataEndRegistration ?? ""}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      dataEndRegistration: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
                />
              </label>
            </>
          ) : null}
          {form.format !== "ONLINE" ? (
            <>
              <div className="md:col-span-2">
                <AddressAutocomplete
                  label="Адрес"
                  value={form.address}
                  required
                  onManualChange={(address) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      address,
                      cordinatX: undefined,
                      cordinatY: undefined,
                    }))
                  }
                  onSelect={(address) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      address: address.address,
                      cordinatX: address.cordinatX,
                      cordinatY: address.cordinatY,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <ArcGisPointMap
                  cordinatX={form.cordinatX ?? null}
                  cordinatY={form.cordinatY ?? null}
                />
              </div>
            </>
          ) : null}
        </div>

        {event.hasMaterials ? (
          <section className="space-y-4 border-t border-zinc-800 pt-5">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                Материалы
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Материалы редактируются здесь же, без отдельного перехода.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input
                value={materialDraft.title}
                onChange={(event) =>
                  setMaterialDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value,
                  }))
                }
                placeholder="Название"
                className="min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
              />
              <input
                value={materialDraft.url}
                onChange={(event) =>
                  setMaterialDraft((currentDraft) => ({
                    ...currentDraft,
                    url: event.target.value,
                  }))
                }
                placeholder="Ссылка"
                className="min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={addMaterial}
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
              >
                Добавить
              </button>
            </div>
            <div className="max-h-56 space-y-3 overflow-y-auto pr-2">
              {materials.map((material, index) => (
                <div
                  key={material.idMaterial ?? index}
                  className="grid gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <input
                    value={material.title}
                    onChange={(event) =>
                      setMaterials((currentMaterials) =>
                        currentMaterials.map((currentMaterial, currentIndex) =>
                          currentIndex === index
                            ? { ...currentMaterial, title: event.target.value }
                            : currentMaterial,
                        ),
                      )
                    }
                    className="min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
                  />
                  <input
                    value={material.url}
                    onChange={(event) =>
                      setMaterials((currentMaterials) =>
                        currentMaterials.map((currentMaterial, currentIndex) =>
                          currentIndex === index
                            ? { ...currentMaterial, url: event.target.value }
                            : currentMaterial,
                        ),
                      )
                    }
                    className="min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMaterials((currentMaterials) =>
                        currentMaterials.filter(
                          (_, currentIndex) => currentIndex !== index,
                        ),
                      )
                    }
                    className="rounded-md border border-red-900/70 px-4 py-2 text-sm text-red-300 hover:bg-red-950/30"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

interface ResultPlaceTarget {
  key: string;
  label: string;
  description?: string;
  latestSolution?: ManagedEventSolution | null;
  caseId?: string | null;
  teamId?: string;
  userId?: string;
}

function ResultPlacesEditor({
  event,
  targets,
  title,
  searchPlaceholder,
  emptyText,
  onOpenSolution,
}: {
  event: ManagedEventDetails;
  targets: ResultPlaceTarget[];
  title: string;
  searchPlaceholder: string;
  emptyText: string;
  onOpenSolution?: (solution: ManagedEventSolution) => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [places, setPlaces] = useState<Record<string, string>>({});
  const duplicatePlaces = getDuplicatePlaces(places);
  const normalizedSearch = normalizeSearch(search);
  const filteredTargets = targets.filter((target) => {
    if (!normalizedSearch) return true;

    return normalizeSearch(
      `${target.label} ${target.description ?? ""}`,
    ).includes(normalizedSearch);
  });

  useEffect(() => {
    setPlaces(
      Object.fromEntries(
        targets.map((target) => [
          target.key,
          getResultPlace(event, {
            caseId: target.caseId,
            teamId: target.teamId,
            userId: target.userId,
          }),
        ]),
      ),
    );
  }, [event, targets]);

  const saveResultsMutation = useMutation({
    mutationFn: () =>
      eventService.updateMyEventResults(event.idEvent, {
        results: buildResultPayload(places, targets),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-event", event.idEvent],
      });
      toast.success("Места сохранены");
    },
    onError: () => toast.error("Не удалось сохранить места"),
  });

  if (!event.hasResualt) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-zinc-100">{title}</p>
        <button
          type="button"
          onClick={() => saveResultsMutation.mutate()}
          disabled={saveResultsMutation.isPending || duplicatePlaces.size > 0}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saveResultsMutation.isPending ? "Сохранение..." : "Сохранить места"}
        </button>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={searchPlaceholder}
        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
      />

      {duplicatePlaces.size > 0 ? (
        <p className="text-sm text-red-300">
          Места не должны повторяться: {[...duplicatePlaces].join(", ")}
        </p>
      ) : null}

      <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
        {filteredTargets.length ? (
          filteredTargets.map((target) => {
            const value = places[target.key] ?? "";
            const numericValue = Number(value);
            const hasDuplicate =
              Number.isInteger(numericValue) &&
              duplicatePlaces.has(numericValue);

            return (
              <div
                key={target.key}
                className="grid gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-3 md:grid-cols-[1fr_120px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {target.label}
                  </p>
                  {target.description ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      {target.description}
                    </p>
                  ) : null}
                  {event.hasLoadedSolution && onOpenSolution ? (
                    <SolutionStatus
                      solution={target.latestSolution}
                      onOpen={onOpenSolution}
                    />
                  ) : null}
                </div>
                <label className="space-y-1">
                  <span className="text-xs text-zinc-500">Место</span>
                  <input
                    type="number"
                    min={1}
                    value={value}
                    onChange={(event) =>
                      setPlaces((currentPlaces) => ({
                        ...currentPlaces,
                        [target.key]: event.target.value,
                      }))
                    }
                    className={`w-full rounded-md border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary ${
                      hasDuplicate ? "border-red-500" : "border-zinc-700"
                    }`}
                  />
                </label>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-zinc-500">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function TeamModal({
  team,
  event,
  onOpenSolution,
  onClose,
}: {
  team: ManagedEventTeam;
  event: ManagedEventDetails;
  onOpenSolution: (solution: ManagedEventSolution) => void;
  onClose: () => void;
}) {
  return (
    <Modal title={team.name} onClose={onClose}>
      <div className="space-y-4">
        <InfoRow label="Капитан" value={formatPersonName(team.caption)} />
        {event.hasLoadedSolution ? (
          <SolutionStatus
            solution={team.latestSolution}
            onOpen={onOpenSolution}
          />
        ) : null}
        <div>
          <p className="mb-3 text-sm text-zinc-500">Участники</p>
          <div className="space-y-2">
            {team.members.map((member) => (
              <div
                key={member.user.idUser}
                className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3"
              >
                <p className="text-sm font-medium text-zinc-100">
                  {formatPersonName(member.user)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {isCaptain(team, member.user.idUser) ? "Капитан" : "Участник"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CaseDetailsModal({
  event,
  eventCase,
  tagOptions,
  onOpenSolution,
  onClose,
}: {
  event: ManagedEventDetails;
  eventCase: ManagedEventCase;
  tagOptions: EventTagOption[];
  onOpenSolution: (solution: ManagedEventSolution) => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: eventCase.title,
    description: eventCase.description ?? "",
    holder: eventCase.holder ?? "",
    teamLimit: eventCase.teamLimit?.toString() ?? "",
    dateForStartSelected: toDateTimeInput(eventCase.dateForStartSelected),
    dateForEndSelected: toDateTimeInput(eventCase.dateForEndSelected),
    dateStopCode: toDateTimeInput(eventCase.dateStopCode),
  });
  const [tags, setTags] = useState<EventTagOption[]>(eventCase.tags ?? []);
  const assignedTeams = event.teams.filter(
    (team) => team.caseId === eventCase.idCase,
  );
  const assignedParticipants = event.participant.filter(
    (participant) => participant.caseId === eventCase.idCase,
  );
  const caseResultTargets: ResultPlaceTarget[] = event.hasTeams
    ? assignedTeams.map((team) => ({
        key: getTargetKey({ teamId: team.idTeam }),
        label: team.name,
        description: team.members
          .map((member) => formatPersonName(member.user))
          .join(", "),
        latestSolution: team.latestSolution,
        caseId: eventCase.idCase,
        teamId: team.idTeam,
      }))
    : assignedParticipants.map((participant) => ({
        key: getTargetKey({ userId: participant.user.idUser }),
        label: formatPersonName(participant.user),
        description: `Дата присоединения: ${formatDate(participant.createAt)}`,
        latestSolution: participant.latestSolution,
        caseId: eventCase.idCase,
        userId: participant.user.idUser,
      }));

  const saveCaseMutation = useMutation({
    mutationFn: () =>
      eventService.updateMyEventCases(event.idEvent, {
        cases: event.cases.map((currentCase) => {
          if (currentCase.idCase !== eventCase.idCase) {
            return caseToPayload(currentCase);
          }

          return {
            ...caseToPayload(currentCase),
            title: form.title.trim(),
            description: form.description.trim(),
            holder: form.holder.trim() || undefined,
            teamLimit: form.teamLimit ? Number(form.teamLimit) : undefined,
            dateForStartSelected: toIsoDate(form.dateForStartSelected) ?? "",
            dateForEndSelected: toIsoDate(form.dateForEndSelected) ?? "",
            dateStopCode: toIsoDate(form.dateStopCode) ?? "",
            tags: tagsToDrafts(tags),
          };
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-event", event.idEvent],
      });
      toast.success("Кейс обновлен");
      setIsEditing(false);
    },
    onError: () => toast.error("Не удалось обновить кейс"),
  });

  return (
    <Modal
      title={isEditing ? "Редактирование кейса" : eventCase.title}
      onClose={onClose}
      wide
      footer={
        isEditing ? (
          <button
            type="button"
            onClick={() => saveCaseMutation.mutate()}
            disabled={saveCaseMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saveCaseMutation.isPending ? "Сохранение..." : "Сохранить кейс"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Редактировать кейс
          </button>
        )
      }
    >
      {isEditing ? (
        <div className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm text-zinc-400">Название</span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  title: event.target.value,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-zinc-400">Описание</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-zinc-400">Кейсодержатель</span>
              <input
                value={form.holder}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    holder: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-zinc-400">Лимит команд</span>
              <input
                type="number"
                min={0}
                value={form.teamLimit}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    teamLimit: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-zinc-400">Старт выбора</span>
              <input
                type="datetime-local"
                value={form.dateForStartSelected}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    dateForStartSelected: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-zinc-400">Конец выбора</span>
              <input
                type="datetime-local"
                value={form.dateForEndSelected}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    dateForEndSelected: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-zinc-400">Стоп-код</span>
              <input
                type="datetime-local"
                value={form.dateStopCode}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    dateStopCode: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-400">Теги</p>
            <TagSelector value={tags} options={tagOptions} onChange={setTags} />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <InfoRow
            label="Описание"
            value={eventCase.description || "Не указано"}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow
              label="Кейсодержатель"
              value={eventCase.holder || "Не указано"}
            />
            <InfoRow
              label="Лимит команд"
              value={eventCase.teamLimit ?? "Не указан"}
            />
            <InfoRow
              label="Старт выбора"
              value={formatDate(eventCase.dateForStartSelected)}
            />
            <InfoRow
              label="Конец выбора"
              value={formatDate(eventCase.dateForEndSelected)}
            />
            <InfoRow
              label="Стоп-код"
              value={formatDate(eventCase.dateStopCode)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-500">Теги</p>
            <div className="flex flex-wrap gap-2">
              {(eventCase.tags ?? []).length ? (
                eventCase.tags.map((tag) => (
                  <span
                    key={tag.idTag ?? tag.name}
                    className="rounded-full border border-primary/40 px-3 py-1 text-sm text-primary"
                  >
                    {tag.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-zinc-500">Теги не указаны</span>
              )}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-zinc-500">Кейс выбрали</p>
            {event.hasResualt ? (
              <ResultPlacesEditor
                event={event}
                targets={caseResultTargets}
                title="Места по кейсу"
                searchPlaceholder={
                  event.hasTeams ? "Поиск команды" : "Поиск участника"
                }
                emptyText={
                  event.hasTeams
                    ? "Пока нет команд, выбравших этот кейс."
                    : "Пока нет участников, выбравших этот кейс."
                }
                onOpenSolution={onOpenSolution}
              />
            ) : null}
            {!event.hasResualt &&
              (event.hasTeams ? (
                assignedTeams.length ? (
                  <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
                    {assignedTeams.map((team) => (
                      <div
                        key={team.idTeam}
                        className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3"
                      >
                        <p className="text-sm font-medium text-zinc-100">
                          {team.name}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          {team.members
                            .map((member) => formatPersonName(member.user))
                            .join(", ")}
                        </p>
                        {event.hasLoadedSolution ? (
                          <SolutionStatus
                            solution={team.latestSolution}
                            onOpen={onOpenSolution}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    Пока нет команд, выбравших этот кейс.
                  </p>
                )
              ) : assignedParticipants.length ? (
                <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
                  {assignedParticipants.map((participant) => (
                    <div
                      key={participant.user.idUser}
                      className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3"
                    >
                      <p className="text-sm font-medium text-zinc-100">
                        {formatPersonName(participant.user)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Дата присоединения: {formatDate(participant.createAt)}
                      </p>
                      {event.hasLoadedSolution ? (
                        <SolutionStatus
                          solution={participant.latestSolution}
                          onOpen={onOpenSolution}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Пока нет участников, выбравших этот кейс.
                </p>
              ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function AddCaseModal({
  event,
  tagOptions,
  onClose,
}: {
  event: ManagedEventDetails;
  tagOptions: EventTagOption[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    holder: "",
    teamLimit: "",
  });
  const [tags, setTags] = useState<EventTagOption[]>([]);
  const caseDateSource = event.cases[0];

  const createCaseMutation = useMutation({
    mutationFn: () =>
      eventService.updateMyEventCases(event.idEvent, {
        cases: [
          ...event.cases.map((currentCase) => caseToPayload(currentCase)),
          {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            holder: form.holder.trim() || undefined,
            teamLimit: form.teamLimit ? Number(form.teamLimit) : undefined,
            dateForStartSelected:
              caseDateSource?.dateForStartSelected ?? event.dataStart,
            dateForEndSelected:
              caseDateSource?.dateForEndSelected ?? event.dataEnd,
            dateStopCode:
              caseDateSource?.dateStopCode ??
              event.dateDeadLine ??
              event.dataEnd,
            isOpen: false,
            tags: tagsToDrafts(tags),
            materials: [],
          },
        ],
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-event", event.idEvent],
      });
      toast.success("Кейс добавлен");
      onClose();
    },
    onError: () => toast.error("Не удалось добавить кейс"),
  });

  return (
    <Modal
      title="Новый кейс"
      onClose={onClose}
      wide
      footer={
        <button
          type="button"
          onClick={() => createCaseMutation.mutate()}
          disabled={createCaseMutation.isPending || !form.title.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {createCaseMutation.isPending ? "Добавление..." : "Добавить кейс"}
        </button>
      }
    >
      <div className="space-y-4">
        <label className="space-y-2">
          <span className="text-sm text-zinc-400">Название</span>
          <input
            value={form.title}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                title: event.target.value,
              }))
            }
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-zinc-400">Описание</span>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                description: event.target.value,
              }))
            }
            rows={4}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-zinc-400">Кейсодержатель</span>
            <input
              value={form.holder}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  holder: event.target.value,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-zinc-400">Лимит команд</span>
            <input
              type="number"
              min={0}
              value={form.teamLimit}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  teamLimit: event.target.value,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary"
            />
          </label>
        </div>
        <div>
          <p className="mb-2 text-sm text-zinc-400">Тэги</p>
          <TagSelector value={tags} options={tagOptions} onChange={setTags} />
        </div>
      </div>
    </Modal>
  );
}

function FinishEventModal({
  isPending,
  onClose,
  onConfirm,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title="Завершить мероприятие"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
          >
            Нет
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Завершение..." : "Да"}
          </button>
        </>
      }
    >
      <p className="text-sm text-zinc-300">
        Вы уверены что хотите досрочно завершить мероприятие?
      </p>
    </Modal>
  );
}

export function AdminEventDetailsPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<ManagedEventTeam | null>(
    null,
  );
  const [selectedCase, setSelectedCase] = useState<ManagedEventCase | null>(
    null,
  );
  const [selectedSolution, setSelectedSolution] =
    useState<ManagedEventSolution | null>(null);
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-event", eventId],
    queryFn: () =>
      eventService.getMyEventDetails(eventId).then((response) => response.data),
    enabled: Boolean(eventId),
  });

  const { data: options } = useQuery({
    queryKey: ["event-create-options"],
    queryFn: () =>
      eventService.getCreateOptions().then((response) => response.data),
  });

  const finishMutation = useMutation({
    mutationFn: () => eventService.finishMyEvent(eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-event", eventId],
      });
      toast.success("Мероприятие завершено");
      setIsFinishOpen(false);
    },
    onError: () => toast.error("Не удалось завершить мероприятие"),
  });

  const totalMembers = useMemo(() => {
    if (!event) return 0;
    if (!event.hasTeams) {
      return event.participant.length;
    }
    const userIds = new Set<string>();
    event.teams.forEach((team) => {
      team.members.forEach((member) => userIds.add(member.user.idUser));
    });
    return userIds.size;
  }, [event]);
  const eventResultTargets = useMemo<ResultPlaceTarget[]>(() => {
    if (!event || event.hasCases || !event.hasResualt) return [];

    if (event.hasTeams) {
      return event.teams.map((team) => ({
        key: getTargetKey({ teamId: team.idTeam }),
        label: team.name,
        description: team.members
          .map((member) => formatPersonName(member.user))
          .join(", "),
        latestSolution: team.latestSolution,
        caseId: null,
        teamId: team.idTeam,
      }));
    }

    return event.participant.map((participant) => ({
      key: getTargetKey({ userId: participant.user.idUser }),
      label: formatPersonName(participant.user),
      description: `Дата присоединения: ${formatDate(participant.createAt)}`,
      latestSolution: participant.latestSolution,
      caseId: null,
      userId: participant.user.idUser,
    }));
  }, [event]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <MiniLoader />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-5 text-red-200">
        Не удалось загрузить мероприятие.
      </div>
    );
  }

  if (event.status === "FINISHED") {
    return (
      <div className="space-y-6">
        <Link
          href={ADMIN_PAGES.EVENTS}
          className="inline-flex text-sm text-primary hover:underline"
        >
          Назад к мероприятиям
        </Link>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm uppercase tracking-wide text-zinc-500">
            Мероприятие завершено
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
            {event.title}
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            Редактирование завершенного мероприятия недоступно.
          </p>
        </div>
      </div>
    );
  }

  const eventPanelsGridClass = event.hasCases
    ? "grid gap-6 lg:grid-cols-2"
    : "grid gap-6 lg:grid-cols-1";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={ADMIN_PAGES.EVENTS}
            className="text-sm text-primary hover:underline"
          >
            Назад к мероприятиям
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-100">
            {event.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            {event.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsCsvOpen(true)}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
          >
            Экспорт CSV
          </button>
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Редактировать
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <DetailPanel title="Статус">
          <p className="text-2xl font-semibold text-zinc-100">{event.status}</p>
        </DetailPanel>
        <DetailPanel title="Зарегистрировано">
          <p className="text-2xl font-semibold text-zinc-100">{totalMembers}</p>
        </DetailPanel>
      </div>

      <DetailPanel title="Основная информация">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoRow label="Тип" value={event.type} />
          <InfoRow label="Формат" value={event.format} />
          <InfoRow label="Публикация" value={event.status} />
          <InfoRow label="Начало" value={formatDate(event.dataStart)} />
          <InfoRow label="Окончание" value={formatDate(event.dataEnd)} />
          <InfoRow label="Дедлайн" value={formatDate(event.dateDeadLine)} />
          <InfoRow label="Адрес" value={event.address || "Не указан"} />
          <InfoRow
            label="Старт регистрации"
            value={formatDate(event.dataStartRegistration)}
          />
          <InfoRow
            label="Конец регистрации"
            value={formatDate(event.dataEndRegistration)}
          />
        </div>
      </DetailPanel>

      <div className={eventPanelsGridClass}>
        {event.teams.length ? (
          <DetailPanel
            title="Команды"
            className={!event.hasCases ? "lg:col-span-1" : ""}
          >
            <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
              {event.teams.map((team) => (
                <div
                  key={team.idTeam}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTeam(team)}
                  onKeyDown={(keyboardEvent) => {
                    if (
                      keyboardEvent.key === "Enter" ||
                      keyboardEvent.key === " "
                    ) {
                      keyboardEvent.preventDefault();
                      setSelectedTeam(team);
                    }
                  }}
                  className="block w-full rounded-md border border-zinc-800 bg-zinc-900/50 p-4 text-left hover:border-primary/60 hover:bg-zinc-900"
                >
                  <p className="font-medium text-zinc-100">{team.name}</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Участников: {team.membersCount}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Капитан: {formatPersonName(team.caption)}
                  </p>
                  {event.hasLoadedSolution ? (
                    <SolutionStatus
                      solution={team.latestSolution}
                      onOpen={setSelectedSolution}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </DetailPanel>
        ) : null}

        {!event.hasTeams &&
        !event.hasResualt &&
        (event.hasCases || event.hasLoadedSolution) ? (
          <DetailPanel title="Участники">
            <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
              {event.participant.length ? (
                event.participant.map((participant) => (
                  <div
                    key={participant.user.idUser}
                    className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <p className="font-medium text-zinc-100">
                      {formatPersonName(participant.user)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Дата присоединения пользователя:{" "}
                      {formatDate(participant.createAt)}
                    </p>
                    {event.hasLoadedSolution ? (
                      <SolutionStatus
                        solution={participant.latestSolution}
                        onOpen={setSelectedSolution}
                      />
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  Участники пока не добавлены.
                </p>
              )}
            </div>
          </DetailPanel>
        ) : null}

        <>
          {event.hasCases ? (
            <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-100">Кейсы</h2>
                <button
                  type="button"
                  onClick={() => setIsAddCaseOpen(true)}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
                >
                  Добавить
                </button>
              </div>
              <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
                {event.cases.map((eventCase) => (
                  <button
                    key={eventCase.idCase}
                    type="button"
                    onClick={() => setSelectedCase(eventCase)}
                    className="block w-full rounded-md border border-zinc-800 bg-zinc-900/50 p-4 text-left hover:border-primary/60 hover:bg-zinc-900"
                  >
                    <p className="font-medium text-zinc-100">
                      {eventCase.title}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                      {eventCase.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(eventCase.tags ?? []).slice(0, 4).map((tag) => (
                        <span
                          key={tag.idTag ?? tag.name}
                          className="rounded-full border border-primary/40 px-2 py-1 text-xs text-primary"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </>
      </div>

      {event.hasResualt && !event.hasCases ? (
        <DetailPanel title="Результаты">
          <ResultPlacesEditor
            event={event}
            targets={eventResultTargets}
            title={event.hasTeams ? "Места команд" : "Места участников"}
            searchPlaceholder={
              event.hasTeams ? "Поиск команды" : "Поиск участника"
            }
            emptyText={
              event.hasTeams
                ? "Команды пока не добавлены."
                : "Участники пока не добавлены."
            }
            onOpenSolution={setSelectedSolution}
          />
        </DetailPanel>
      ) : null}

      {event.hasMaterials ? (
        <DetailPanel title="Материалы">
          <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
            {event.materials.length ? (
              event.materials.map((material: ManagedEventMaterial) => (
                <a
                  key={material.idMaterial}
                  href={material.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-zinc-800 bg-zinc-900/50 p-4 hover:border-primary/60"
                >
                  <p className="font-medium text-zinc-100">{material.title}</p>
                  <p className="mt-1 break-all text-sm text-primary">
                    {material.url}
                  </p>
                </a>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Материалы не добавлены.</p>
            )}
          </div>
        </DetailPanel>
      ) : null}

      <EventInviteSection eventId={event.idEvent} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsFinishOpen(true)}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Завершить мероприятие
        </button>
      </div>

      {isEditOpen ? (
        <EditEventModal event={event} onClose={() => setIsEditOpen(false)} />
      ) : null}
      {selectedTeam ? (
        <TeamModal
          team={selectedTeam}
          event={event}
          onOpenSolution={setSelectedSolution}
          onClose={() => setSelectedTeam(null)}
        />
      ) : null}
      {selectedCase ? (
        <CaseDetailsModal
          event={event}
          eventCase={selectedCase}
          tagOptions={options?.tags ?? []}
          onOpenSolution={setSelectedSolution}
          onClose={() => setSelectedCase(null)}
        />
      ) : null}
      {selectedSolution ? (
        <SolutionDetailsModal
          solution={selectedSolution}
          onClose={() => setSelectedSolution(null)}
        />
      ) : null}
      {isAddCaseOpen ? (
        <AddCaseModal
          event={event}
          tagOptions={options?.tags ?? []}
          onClose={() => setIsAddCaseOpen(false)}
        />
      ) : null}
      {isCsvOpen ? (
        <AdminEventCsvExportModal
          event={event}
          onClose={() => setIsCsvOpen(false)}
        />
      ) : null}
      {isFinishOpen ? (
        <FinishEventModal
          isPending={finishMutation.isPending}
          onClose={() => setIsFinishOpen(false)}
          onConfirm={() => finishMutation.mutate()}
        />
      ) : null}
    </div>
  );
}
