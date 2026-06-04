"use client";

import { MiniLoader } from "@/components/ui/MiniLoader";
import eventService from "@/services/event.service";
import {
  ManagedEventAdminPermissions,
  ManagedEventAdminUser,
} from "@/types/event-management.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

type EventAdminPermissionKey = keyof ManagedEventAdminPermissions;

const EVENT_ADMIN_PERMISSION_LABELS: Array<{
  key: EventAdminPermissionKey;
  label: string;
  description: string;
}> = [
  {
    key: "canView",
    label: "Просмотр",
    description: "Видит мероприятие в панели администратора",
  },
  {
    key: "canEditGeneral",
    label: "Редактировать описание",
    description: "Меняет основные данные мероприятия",
  },
  {
    key: "canEditSettings",
    label: "Редактировать настройки",
    description: "Меняет возможности, лимиты и дедлайны",
  },
  {
    key: "canEditMaterials",
    label: "Редактировать материалы",
    description: "Добавляет и меняет материалы мероприятия",
  },
  {
    key: "canEditCases",
    label: "Редактировать кейсы",
    description: "Добавляет и меняет кейсы",
  },
  {
    key: "canViewParticipants",
    label: "Участники",
    description: "Видит список участников",
  },
  {
    key: "canViewTeams",
    label: "Команды",
    description: "Видит команды мероприятия",
  },
  {
    key: "canViewSolutions",
    label: "Решения",
    description: "Видит решения участников",
  },
  {
    key: "canViewResults",
    label: "Итоги",
    description: "Видит результаты мероприятия",
  },
  {
    key: "canEditResults",
    label: "Редактировать итоги",
    description: "Выставляет и меняет места",
  },
  {
    key: "canDeleteResults",
    label: "Удалять итоги",
    description: "Может очищать места",
  },
  {
    key: "canFinishEvent",
    label: "Завершить мероприятие",
    description: "Может досрочно завершить мероприятие",
  },
  {
    key: "canExportCsv",
    label: "Экспорт CSV",
    description: "Может выгружать данные мероприятия",
  },
  {
    key: "canManagePrivateInvites",
    label: "Приватные приглашения",
    description: "Может приглашать участников и обрабатывать заявки",
  },
  {
    key: "canViewTurniketStats",
    label: "Статистика турникетов",
    description: "Видит журнал проходов и общую статистику турникетов",
  },
  {
    key: "canManageTurnikets",
    label: "Управлять турникетами",
    description: "Создаёт, включает, выключает и удаляет турникеты",
  },
];

export const EMPTY_EVENT_ADMIN_PERMISSIONS =
  EVENT_ADMIN_PERMISSION_LABELS.reduce(
    (acc, permission) => ({ ...acc, [permission.key]: false }),
    {} as ManagedEventAdminPermissions,
  );

const EVENT_ADMIN_PERMISSION_DEPENDENCIES: Partial<
  Record<EventAdminPermissionKey, EventAdminPermissionKey[]>
> = {
  canEditGeneral: ["canView"],
  canEditSettings: ["canView"],
  canEditMaterials: ["canView"],
  canEditCases: ["canView"],
  canViewParticipants: ["canView"],
  canViewTeams: ["canView"],
  canViewSolutions: ["canView"],
  canViewResults: ["canView"],
  canEditResults: ["canView", "canViewResults"],
  canDeleteResults: ["canView", "canViewResults", "canEditResults"],
  canFinishEvent: ["canView"],
  canExportCsv: ["canView"],
  canManagePrivateInvites: ["canView"],
  canViewTurniketStats: ["canView"],
  canManageTurnikets: ["canView"],
};

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
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

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function formatAdminLabel(user: ManagedEventAdminUser) {
  return `${formatPersonName(user)} - ${user.email}`;
}

function applyEventAdminPermissionDependencies(
  permissions: ManagedEventAdminPermissions,
) {
  const normalized = { ...permissions };
  let changed = true;

  while (changed) {
    changed = false;

    EVENT_ADMIN_PERMISSION_LABELS.forEach((permission) => {
      if (!normalized[permission.key]) return;

      (EVENT_ADMIN_PERMISSION_DEPENDENCIES[permission.key] ?? []).forEach(
        (dependency) => {
          if (normalized[dependency]) return;

          normalized[dependency] = true;
          changed = true;
        },
      );
    });
  }

  return normalized;
}

function getLockedEventAdminPermissions(
  permissions: ManagedEventAdminPermissions,
) {
  const locked = new Set<EventAdminPermissionKey>();

  EVENT_ADMIN_PERMISSION_LABELS.forEach((permission) => {
    if (!permissions[permission.key]) return;

    (EVENT_ADMIN_PERMISSION_DEPENDENCIES[permission.key] ?? []).forEach(
      (dependency) => locked.add(dependency),
    );
  });

  return locked;
}

export function EventAdminAccessModal({
  eventId,
  eventStatus,
  onClose,
}: {
  eventId: string;
  eventStatus?: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const adminSearchRef = useRef<HTMLDivElement | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [isAdminSearchOpen, setIsAdminSearchOpen] = useState(false);
  const [permissions, setPermissions] = useState<ManagedEventAdminPermissions>(
    EMPTY_EVENT_ADMIN_PERMISSIONS,
  );
  const queryKey = ["admin-event-access", eventId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      eventService
        .getMyEventAdminAccessOptions(eventId)
        .then((response) => response.data),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      eventService.upsertMyEventAdminAccess(eventId, {
        userId: selectedUserId,
        ...permissions,
      }),
    onSuccess: async (response) => {
      queryClient.setQueryData(queryKey, response.data);
      await queryClient.invalidateQueries({
        queryKey: ["admin-event", eventId],
      });
      toast.success("Права администратора сохранены");
    },
    onError: () =>
      toast.error("Не удалось сохранить права администратора"),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) =>
      eventService.deleteMyEventAdminAccess(eventId, userId),
    onSuccess: async (response) => {
      queryClient.setQueryData(queryKey, response.data);
      await queryClient.invalidateQueries({
        queryKey: ["admin-event", eventId],
      });
      toast.success("Администратор удален из мероприятия");
    },
    onError: () =>
      toast.error("Не удалось удалить администратора"),
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: () =>
      eventService.transferMyEventOwnership(eventId, selectedUserId),
    onSuccess: async (response) => {
      queryClient.setQueryData(queryKey, response.data);
      await queryClient.invalidateQueries({
        queryKey: ["admin-event", eventId],
      });
      toast.success("Владелец мероприятия изменен");
    },
    onError: () =>
      toast.error("Не удалось передать владение мероприятием"),
  });

  const selectedAccess = data?.access.find(
    (access) => access.userId === selectedUserId,
  );
  const availableCandidates =
    data?.candidates.filter(
      (candidate) =>
        candidate.idUser === selectedUserId ||
        !data.access.some((access) => access.userId === candidate.idUser),
    ) ?? [];
  const filteredCandidates = availableCandidates.filter((candidate) => {
    const search = normalizeSearch(adminSearch);
    if (!search) return true;

    return normalizeSearch(formatAdminLabel(candidate)).includes(search);
  });
  const selectedUser = selectedUserId
    ? availableCandidates.find((candidate) => candidate.idUser === selectedUserId) ??
      data?.access.find((access) => access.userId === selectedUserId)?.user
    : null;
  const canTransferOwnership =
    Boolean(data?.canTransferOwnership) &&
    Boolean(selectedUserId) &&
    Boolean(selectedUser) &&
    selectedUserId !== data?.owner?.idUser;
  const visiblePermissionLabels = useMemo(
    () =>
      EVENT_ADMIN_PERMISSION_LABELS.filter(
        (permission) =>
          eventStatus === "PRIVATE" ||
          permission.key !== "canManagePrivateInvites",
      ),
    [eventStatus],
  );

  const selectAdminCandidate = (candidate: ManagedEventAdminUser) => {
    setSelectedUserId(candidate.idUser);
    setAdminSearch(formatAdminLabel(candidate));
    setIsAdminSearchOpen(false);
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        adminSearchRef.current &&
        !adminSearchRef.current.contains(event.target as Node)
      ) {
        setIsAdminSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setPermissions(EMPTY_EVENT_ADMIN_PERMISSIONS);
      return;
    }

    const access = data?.access.find((item) => item.userId === selectedUserId);
    if (!access) {
      setPermissions(EMPTY_EVENT_ADMIN_PERMISSIONS);
      return;
    }

    setPermissions(
      applyEventAdminPermissionDependencies(
        EVENT_ADMIN_PERMISSION_LABELS.reduce(
          (acc, permission) => ({
            ...acc,
            [permission.key]: access[permission.key],
          }),
          {} as ManagedEventAdminPermissions,
        ),
      ),
    );
  }, [data?.access, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId || !data) return;

    const candidate =
      data.candidates.find((item) => item.idUser === selectedUserId) ??
      data.access.find((item) => item.userId === selectedUserId)?.user;

    if (candidate) {
      setAdminSearch(formatAdminLabel(candidate));
    }
  }, [data, selectedUserId]);

  const applyExpertPreset = () => {
    if (!data?.presets.expert) return;
    setPermissions(applyEventAdminPermissionDependencies(data.presets.expert));
  };

  const applyAdminPreset = () => {
    if (!data?.presets.admin) return;
    setPermissions(applyEventAdminPermissionDependencies(data.presets.admin));
  };

  const togglePermission = (key: EventAdminPermissionKey) => {
    setPermissions((current) => {
      const lockedPermissions = getLockedEventAdminPermissions(current);
      if (current[key] && lockedPermissions.has(key)) return current;

      return applyEventAdminPermissionDependencies({
        ...current,
        [key]: !current[key],
      });
    });
  };
  const lockedPermissions = getLockedEventAdminPermissions(permissions);

  return (
    <Modal
      title="Администраторы мероприятия"
      onClose={onClose}
      wide
      footer={
        <>
          {data?.canTransferOwnership ? (
            <button
              type="button"
              onClick={() => transferOwnershipMutation.mutate()}
              disabled={
                !canTransferOwnership || transferOwnershipMutation.isPending
              }
              className="rounded-md border border-amber-700/70 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {transferOwnershipMutation.isPending
                ? "Передача..."
                : "Передать владение"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!selectedUserId || saveMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveMutation.isPending ? "Сохранение..." : "Сохранить права"}
          </button>
        </>
      }
    >
      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <MiniLoader />
        </div>
      ) : (
        <div className="grid gap-5">
          {data?.owner ? (
            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm text-zinc-500">Владелец мероприятия</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                {formatPersonName(data.owner)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{data.owner.email}</p>
            </div>
          ) : null}

          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-200">
              Администратор организации
            </label>
            <div ref={adminSearchRef} className="relative">
              <input
                type="text"
                value={adminSearch}
                onChange={(event) => {
                  setAdminSearch(event.target.value);
                  setSelectedUserId("");
                  setIsAdminSearchOpen(true);
                }}
                onFocus={() => setIsAdminSearchOpen(true)}
                placeholder="Начните вводить имя или email"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-primary"
              />
              {isAdminSearchOpen ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 shadow-xl">
                  {filteredCandidates.length ? (
                    filteredCandidates.map((candidate) => (
                      <button
                        key={candidate.idUser}
                        type="button"
                        onClick={() => selectAdminCandidate(candidate)}
                        className="block w-full px-3 py-3 text-left text-sm hover:bg-zinc-900"
                      >
                        <span className="block font-medium text-zinc-100">
                          {formatPersonName(candidate)}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {candidate.email}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-3 text-sm text-zinc-500">
                      Администраторы не найдены
                    </p>
                  )}
                </div>
              ) : null}
            </div>
            {selectedUser ? (
              <p className="text-xs text-zinc-500">
                Выбран: {formatAdminLabel(selectedUser)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={applyExpertPreset}
              className="rounded-md border border-emerald-700/70 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-950/30"
            >
              Шаблон: Эксперт
            </button>
            <button
              type="button"
              onClick={applyAdminPreset}
              className="rounded-md border border-primary/70 px-3 py-2 text-sm text-primary hover:bg-primary/10"
            >
              Шаблон: Администратор
            </button>
            {selectedAccess ? (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(selectedAccess.userId)}
                disabled={deleteMutation.isPending}
                className="rounded-md border border-red-800 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-60"
              >
                Удалить доступ
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {visiblePermissionLabels.map((permission) => {
              const isLocked =
                permissions[permission.key] &&
                lockedPermissions.has(permission.key);

              return (
                <label
                  key={permission.key}
                  className={`flex gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-3 ${
                    isLocked ? "opacity-75" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissions[permission.key]}
                    disabled={isLocked}
                    onChange={() => togglePermission(permission.key)}
                    className="mt-1 h-4 w-4 accent-primary disabled:cursor-not-allowed"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-100">
                      {permission.label}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {permission.description}
                      {isLocked ? " Включено автоматически." : ""}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-zinc-200">
              Уже добавлены
            </h3>
            {data?.access.length ? (
              data.access.map((access) => (
                <button
                  key={access.idAccess}
                  type="button"
                  onClick={() => setSelectedUserId(access.userId)}
                  className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-left hover:border-primary/60"
                >
                  <p className="text-sm font-medium text-zinc-100">
                    {formatAdminLabel(access.user)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {
                      visiblePermissionLabels.filter(
                        (permission) => access[permission.key],
                      ).length
                    }{" "}
                    прав включено
                  </p>
                </button>
              ))
            ) : (
              <p className="text-sm text-zinc-500">
                Дополнительные администраторы пока не назначены.
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
