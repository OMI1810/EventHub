"use client";

import eventService from "@/services/event.service";
import {
  ManagedEventAdminAccessOptions,
  ManagedEventDetails,
  ManagedEventTeam,
} from "@/types/event-management.types";
import {
  IOrganizationAdminSummary,
  IOrganizationEventSummary,
  IOrganizationSummary,
} from "@/types/organization.types";
import { addCsvSection, CsvValue, downloadCsv } from "@/utils/csv-export";
import { useState } from "react";
import toast from "react-hot-toast";

type OrganizationExportOption =
  | "organization"
  | "organizationAdmins"
  | "events"
  | "eventAdmins"
  | "participants"
  | "teams"
  | "cases"
  | "solutions"
  | "results";

interface OrganizationCsvExportModalProps {
  organization: IOrganizationSummary;
  admins: IOrganizationAdminSummary[];
  events: IOrganizationEventSummary[];
  onClose: () => void;
}

const optionLabels: Record<OrganizationExportOption, string> = {
  organization: "Данные организации",
  organizationAdmins: "Администраторы организации",
  events: "Мероприятия",
  eventAdmins: "Администраторы мероприятий и права",
  participants: "Участники мероприятий",
  teams: "Команды",
  cases: "Кейсы",
  solutions: "Решения",
  results: "Результаты",
};

const defaultOptions: OrganizationExportOption[] = [
  "organization",
  "organizationAdmins",
  "events",
  "eventAdmins",
  "participants",
  "teams",
  "cases",
  "solutions",
  "results",
];

function formatDate(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

function permissionText(value?: boolean) {
  return value ? "Да" : "Нет";
}

function buildEventAdminRows(
  event: ManagedEventDetails,
  accessOptions?: ManagedEventAdminAccessOptions,
) {
  const rows: CsvValue[][] = [];

  if (accessOptions?.owner) {
    rows.push([
      "Администраторы мероприятий",
      event.title,
      formatPersonName(accessOptions.owner),
      accessOptions.owner.email,
      "Да",
      ...Array(14).fill("Да"),
    ]);
  }

  accessOptions?.access.forEach((access) => {
    rows.push([
      "Администраторы мероприятий",
      event.title,
      formatPersonName(access.user),
      access.user.email,
      "Нет",
      permissionText(access.canView),
      permissionText(access.canEditGeneral),
      permissionText(access.canEditSettings),
      permissionText(access.canEditMaterials),
      permissionText(access.canEditCases),
      permissionText(access.canViewParticipants),
      permissionText(access.canViewTeams),
      permissionText(access.canViewSolutions),
      permissionText(access.canViewResults),
      permissionText(access.canEditResults),
      permissionText(access.canDeleteResults),
      permissionText(access.canFinishEvent),
      permissionText(access.canExportCsv),
      permissionText(access.canManagePrivateInvites),
    ]);
  });

  return rows;
}

function buildOrganizationCsvRows({
  organization,
  admins,
  eventDetails,
  eventAdminAccess,
  selectedOptions,
}: {
  organization: IOrganizationSummary;
  admins: IOrganizationAdminSummary[];
  eventDetails: ManagedEventDetails[];
  eventAdminAccess: Record<string, ManagedEventAdminAccessOptions | undefined>;
  selectedOptions: OrganizationExportOption[];
}) {
  const rows: CsvValue[][] = [];

  if (selectedOptions.includes("organization")) {
    addCsvSection(rows, "Организация");
    rows.push(["Поле", "Значение"]);
    rows.push(["ID", organization.idOrganization]);
    rows.push(["Название", organization.name]);
    rows.push(["Описание", organization.description ?? ""]);
    rows.push(["Адрес", organization.address ?? ""]);
    rows.push(["Координата X", organization.cordinatX ?? ""]);
    rows.push(["Координата Y", organization.cordinatY ?? ""]);
    rows.push(["Владелец", organization.owner.email]);
    rows.push(["Телефон владельца", organization.owner.phone ?? ""]);
    rows.push(["Контакт владельца", organization.owner.contact ?? ""]);
  }

  if (selectedOptions.includes("organizationAdmins")) {
    addCsvSection(rows, "Администраторы организации");
    rows.push(["Раздел", "ID", "ФИО", "Email", "Телефон", "Контакт", "Роль"]);

    admins.forEach((admin) => {
      rows.push([
        "Администраторы организации",
        admin.idUser,
        formatPersonName(admin),
        admin.email,
        admin.phone ?? "",
        admin.contact ?? "",
        admin.role ?? "",
      ]);
    });
  }

  if (selectedOptions.includes("events")) {
    addCsvSection(rows, "Мероприятия");
    rows.push([
      "Раздел",
      "ID",
      "Slug",
      "Название",
      "Описание",
      "Тип",
      "Формат",
      "Статус",
      "Начало",
      "Окончание",
      "Регистрация с",
      "Регистрация до",
      "Участники",
      "Команды",
    ]);

    eventDetails.forEach((event) => {
      rows.push([
        "Мероприятия",
        event.idEvent,
        event.slug,
        event.title,
        event.description ?? "",
        event.type,
        event.format,
        event.status,
        formatDate(event.dataStart),
        formatDate(event.dataEnd),
        formatDate(event.dataStartRegistration),
        formatDate(event.dataEndRegistration),
        event.registeredUsersCount,
        event.teams.length,
      ]);
    });
  }

  if (selectedOptions.includes("eventAdmins")) {
    addCsvSection(rows, "Администраторы мероприятий");
    rows.push([
      "Раздел",
      "Мероприятие",
      "ФИО",
      "Email",
      "Владелец",
      "Просмотр",
      "Редактирование описания",
      "Редактирование настроек",
      "Редактирование материалов",
      "Редактирование кейсов",
      "Участники",
      "Команды",
      "Решения",
      "Результаты",
      "Редактирование результатов",
      "Удаление результатов",
      "Завершение мероприятия",
      "Экспорт CSV",
      "Приватные приглашения",
    ]);

    eventDetails.forEach((event) => {
      rows.push(...buildEventAdminRows(event, eventAdminAccess[event.idEvent]));
    });
  }

  if (selectedOptions.includes("participants")) {
    addCsvSection(rows, "Участники мероприятий");
    rows.push(["Раздел", "Мероприятие", "ID", "ФИО", "Дата присоединения", "Команда", "Роль", "Кейс"]);

    eventDetails.forEach((event) => {
      const caseById = new Map(
        event.cases.map((eventCase) => [eventCase.idCase, eventCase]),
      );

      if (event.hasTeams) {
        event.teams.forEach((team) => {
          const currentCase = team.caseId ? caseById.get(team.caseId) : null;

          team.members.forEach((member) => {
            rows.push([
              "Участники мероприятий",
              event.title,
              member.user.idUser,
              formatPersonName(member.user),
              "",
              team.name,
              isCaptain(team, member.user.idUser) ? "Капитан" : "Участник",
              currentCase?.title ?? "",
            ]);
          });
        });
        return;
      }

      event.participant.forEach((participant) => {
        const currentCase = participant.caseId
          ? caseById.get(participant.caseId)
          : null;

        rows.push([
          "Участники мероприятий",
          event.title,
          participant.user.idUser,
          formatPersonName(participant.user),
          formatDate(participant.createAt),
          "",
          "Участник",
          currentCase?.title ?? "",
        ]);
      });
    });
  }

  if (selectedOptions.includes("teams")) {
    addCsvSection(rows, "Команды");
    rows.push(["Раздел", "Мероприятие", "ID", "Название", "Описание", "Формат", "Капитан", "Участники", "Кейс"]);

    eventDetails.forEach((event) => {
      const caseById = new Map(
        event.cases.map((eventCase) => [eventCase.idCase, eventCase]),
      );

      event.teams.forEach((team) => {
        rows.push([
          "Команды",
          event.title,
          team.idTeam,
          team.name,
          team.description ?? "",
          team.format,
          formatPersonName(team.caption),
          team.members.map((member) => formatPersonName(member.user)).join(", "),
          team.caseId ? caseById.get(team.caseId)?.title ?? "" : "",
        ]);
      });
    });
  }

  if (selectedOptions.includes("cases")) {
    addCsvSection(rows, "Кейсы");
    rows.push(["Раздел", "Мероприятие", "ID", "Название", "Описание", "Кейсодержатель", "Лимит команд", "Начало выбора", "Окончание выбора", "Стоп-код"]);

    eventDetails.forEach((event) => {
      event.cases.forEach((eventCase) => {
        rows.push([
          "Кейсы",
          event.title,
          eventCase.idCase,
          eventCase.title,
          eventCase.description ?? "",
          eventCase.holder ?? "",
          eventCase.teamLimit ?? "",
          formatDate(eventCase.dateForStartSelected),
          formatDate(eventCase.dateForEndSelected),
          formatDate(eventCase.dateStopCode),
        ]);
      });
    });
  }

  if (selectedOptions.includes("solutions")) {
    addCsvSection(rows, "Решения");
    rows.push(["Раздел", "Мероприятие", "ID", "Команда", "Участник", "Кейс", "Решение", "Презентация", "Описание", "Создано", "Обновлено"]);

    eventDetails.forEach((event) => {
      const caseById = new Map(
        event.cases.map((eventCase) => [eventCase.idCase, eventCase]),
      );
      const teamById = new Map(event.teams.map((team) => [team.idTeam, team]));
      const participantByUserId = new Map(
        event.participant.map((participant) => [
          participant.user.idUser,
          participant,
        ]),
      );

      event.solutions.forEach((solution) => {
        const team = solution.teamId ? teamById.get(solution.teamId) : null;
        const participant = solution.userId
          ? participantByUserId.get(solution.userId)
          : null;

        rows.push([
          "Решения",
          event.title,
          solution.idSolution,
          team?.name ?? "",
          participant ? formatPersonName(participant.user) : "",
          solution.caseId ? caseById.get(solution.caseId)?.title ?? "" : "",
          solution.urlSolution,
          solution.urlPresentation,
          solution.description ?? "",
          formatDate(solution.createdAt),
          formatDate(solution.updateAt),
        ]);
      });
    });
  }

  if (selectedOptions.includes("results")) {
    addCsvSection(rows, "Результаты");
    rows.push(["Раздел", "Мероприятие", "ID", "Место", "Название", "Команда", "Участник", "Кейс", "Балл", "Описание"]);

    eventDetails.forEach((event) => {
      const caseById = new Map(
        event.cases.map((eventCase) => [eventCase.idCase, eventCase]),
      );
      const teamById = new Map(event.teams.map((team) => [team.idTeam, team]));
      const participantByUserId = new Map(
        event.participant.map((participant) => [
          participant.user.idUser,
          participant,
        ]),
      );

      event.results.forEach((result) => {
        const team = result.teamId ? teamById.get(result.teamId) : null;
        const participant = result.userId
          ? participantByUserId.get(result.userId)
          : null;

        rows.push([
          "Результаты",
          event.title,
          result.idResult,
          result.place,
          result.title,
          team?.name ?? "",
          participant ? formatPersonName(participant.user) : "",
          result.caseId ? caseById.get(result.caseId)?.title ?? "" : "",
          result.score ?? "",
          result.description ?? "",
        ]);
      });
    });
  }

  return rows;
}

export function OrganizationCsvExportModal({
  organization,
  admins,
  events,
  onClose,
}: OrganizationCsvExportModalProps) {
  const [selectedOptions, setSelectedOptions] =
    useState<OrganizationExportOption[]>(defaultOptions);
  const [isExporting, setIsExporting] = useState(false);

  const toggleOption = (option: OrganizationExportOption) => {
    setSelectedOptions((currentOptions) =>
      currentOptions.includes(option)
        ? currentOptions.filter((currentOption) => currentOption !== option)
        : [...currentOptions, option],
    );
  };

  const exportCsv = async () => {
    setIsExporting(true);

    try {
      const eventDetails = await Promise.all(
        events.map((event) =>
          eventService.getMyEventDetails(event.idEvent).then((response) => response.data),
        ),
      );
      const shouldLoadEventAdmins = selectedOptions.includes("eventAdmins");
      const eventAdminAccessEntries = shouldLoadEventAdmins
        ? await Promise.all(
            events.map(async (event) => {
              const response = await eventService.getMyEventAdminAccessOptions(
                event.idEvent,
              );

              return [event.idEvent, response.data] as const;
            }),
          )
        : [];

      downloadCsv(
        `${organization.name}-organization-export.csv`,
        buildOrganizationCsvRows({
          organization,
          admins,
          eventDetails,
          eventAdminAccess: Object.fromEntries(eventAdminAccessEntries),
          selectedOptions,
        }),
      );
      onClose();
    } catch {
      toast.error("Не удалось сформировать CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            Экспорт данных организации
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            x
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          {defaultOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-100"
            >
              <input
                type="checkbox"
                checked={selectedOptions.includes(option)}
                onChange={() => toggleOption(option)}
                className="h-4 w-4"
              />
              {optionLabels[option]}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={exportCsv}
            disabled={isExporting || selectedOptions.length === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isExporting ? "Формирование..." : "Скачать CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
