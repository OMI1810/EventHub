"use client";

import { CsvExportModalFrame } from "@/components/csv/CsvExportModalFrame";
import eventService from "@/services/event.service";
import {
  ManagedEventAdminAccessOptions,
  ManagedEventDetails,
  ManagedEventTeam,
} from "@/types/event-management.types";
import { addCsvSection, CsvValue, downloadCsv } from "@/utils/csv-export";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type ExportOption =
  | "event"
  | "eventAdmins"
  | "participants"
  | "teams"
  | "cases"
  | "solutions"
  | "results";

interface AdminEventCsvExportModalProps {
  event: ManagedEventDetails;
  onClose: () => void;
}
const optionLabels: Record<ExportOption, string> = {
  event: "Основная информация мероприятия",
  eventAdmins: "Администраторы мероприятия и права",
  participants: "Участники",
  teams: "Команды и составы",
  cases: "Кейсы",
  solutions: "Решения",
  results: "Результаты",
};

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

function getAvailableOptions(event: ManagedEventDetails): ExportOption[] {
  const options: ExportOption[] = ["event", "cases"];

  if (event.permissions.hasFullAccess) {
    options.push("eventAdmins");
  }

  if (event.permissions.canViewParticipants) {
    options.push("participants");
  }

  if (event.permissions.canViewTeams) {
    options.push("teams");
  }

  if (event.permissions.canViewSolutions) {
    options.push("solutions");
  }

  if (event.permissions.canViewResults || event.permissions.canEditResults) {
    options.push("results");
  }

  return options;
}

function buildAdminRows(accessOptions?: ManagedEventAdminAccessOptions) {
  const rows: CsvValue[][] = [
    [
      "Раздел",
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
    ],
  ];

  if (accessOptions?.owner) {
    rows.push([
      "Администраторы",
      formatPersonName(accessOptions.owner),
      accessOptions.owner.email,
      "Да",
      ...Array(14).fill("Да"),
    ]);
  }

  accessOptions?.access.forEach((access) => {
    rows.push([
      "Администраторы",
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

function buildAdminEventCsvRows(
  event: ManagedEventDetails,
  selectedOptions: ExportOption[],
  accessOptions?: ManagedEventAdminAccessOptions,
) {
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
  const rows: CsvValue[][] = [];

  if (selectedOptions.includes("event")) {
    addCsvSection(rows, "Основная информация");
    rows.push(["Поле", "Значение"]);
    rows.push(["ID", event.idEvent]);
    rows.push(["Slug", event.slug]);
    rows.push(["Название", event.title]);
    rows.push(["Описание", event.description ?? ""]);
    rows.push(["Тип", event.type]);
    rows.push(["Формат", event.format]);
    rows.push(["Статус", event.status]);
    rows.push(["Адрес", event.address]);
    rows.push(["Начало", formatDate(event.dataStart)]);
    rows.push(["Окончание", formatDate(event.dataEnd)]);
    rows.push(["Начало регистрации", formatDate(event.dataStartRegistration)]);
    rows.push(["Окончание регистрации", formatDate(event.dataEndRegistration)]);
    rows.push(["Дедлайн решений", formatDate(event.dateDeadLine)]);
    rows.push(["Лимит участников", event.participantLimit ?? ""]);
    rows.push(["Лимит участников в команде", event.participanInTeamLimit ?? ""]);
  }

  if (selectedOptions.includes("eventAdmins")) {
    addCsvSection(rows, "Администраторы мероприятия");
    rows.push(...buildAdminRows(accessOptions));
  }

  if (selectedOptions.includes("participants")) {
    addCsvSection(rows, "Участники");
    rows.push(["Раздел", "ID", "ФИО", "Дата присоединения", "Команда", "Роль", "Кейс"]);

    if (event.hasTeams) {
      event.teams.forEach((team) => {
        const currentCase = team.caseId ? caseById.get(team.caseId) : null;

        team.members.forEach((member) => {
          rows.push([
            "Участники",
            member.user.idUser,
            formatPersonName(member.user),
            "",
            team.name,
            isCaptain(team, member.user.idUser) ? "Капитан" : "Участник",
            currentCase?.title ?? "",
          ]);
        });
      });
    } else {
      event.participant.forEach((participant) => {
        const currentCase = participant.caseId
          ? caseById.get(participant.caseId)
          : null;

        rows.push([
          "Участники",
          participant.user.idUser,
          formatPersonName(participant.user),
          formatDate(participant.createAt),
          "",
          "Участник",
          currentCase?.title ?? "",
        ]);
      });
    }
  }

  if (selectedOptions.includes("teams")) {
    addCsvSection(rows, "Команды");
    rows.push(["Раздел", "ID", "Название", "Описание", "Формат", "Капитан", "Участники", "Кейс"]);

    event.teams.forEach((team) => {
      const currentCase = team.caseId ? caseById.get(team.caseId) : null;

      rows.push([
        "Команды",
        team.idTeam,
        team.name,
        team.description ?? "",
        team.format,
        formatPersonName(team.caption),
        team.members.map((member) => formatPersonName(member.user)).join(", "),
        currentCase?.title ?? "",
      ]);
    });
  }

  if (selectedOptions.includes("cases")) {
    addCsvSection(rows, "Кейсы");
    rows.push([
      "Раздел",
      "ID",
      "Название",
      "Описание",
      "Кейсодержатель",
      "Лимит команд",
      "Начало выбора",
      "Окончание выбора",
      "Стоп-код",
      "Команды",
      "Участники",
    ]);

    event.cases.forEach((eventCase) => {
      const assignedTeams = event.teams.filter(
        (team) => team.caseId === eventCase.idCase,
      );
      const assignedParticipants = event.participant.filter(
        (participant) => participant.caseId === eventCase.idCase,
      );

      rows.push([
        "Кейсы",
        eventCase.idCase,
        eventCase.title,
        eventCase.description ?? "",
        eventCase.holder ?? "",
        eventCase.teamLimit ?? "",
        formatDate(eventCase.dateForStartSelected),
        formatDate(eventCase.dateForEndSelected),
        formatDate(eventCase.dateStopCode),
        assignedTeams.map((team) => team.name).join(", "),
        event.hasTeams
          ? assignedTeams
              .flatMap((team) =>
                team.members.map((member) => formatPersonName(member.user)),
              )
              .join(", ")
          : assignedParticipants
              .map((participant) => formatPersonName(participant.user))
              .join(", "),
      ]);
    });
  }

  if (selectedOptions.includes("solutions")) {
    addCsvSection(rows, "Решения");
    rows.push([
      "Раздел",
      "ID",
      "Команда",
      "Участник",
      "Кейс",
      "Ссылка на решение",
      "Ссылка на презентацию",
      "Описание",
      "Создано",
      "Обновлено",
    ]);

    event.solutions.forEach((solution) => {
      const team = solution.teamId ? teamById.get(solution.teamId) : null;
      const participant = solution.userId
        ? participantByUserId.get(solution.userId)
        : null;
      const currentCase = solution.caseId ? caseById.get(solution.caseId) : null;

      rows.push([
        "Решения",
        solution.idSolution,
        team?.name ?? "",
        participant ? formatPersonName(participant.user) : "",
        currentCase?.title ?? "",
        solution.urlSolution,
        solution.urlPresentation,
        solution.description ?? "",
        formatDate(solution.createdAt),
        formatDate(solution.updateAt),
      ]);
    });
  }

  if (selectedOptions.includes("results")) {
    addCsvSection(rows, "Результаты");
    rows.push(["Раздел", "ID", "Место", "Название", "Команда", "Участник", "Кейс", "Балл", "Описание"]);

    event.results.forEach((result) => {
      const team = result.teamId ? teamById.get(result.teamId) : null;
      const participant = result.userId
        ? participantByUserId.get(result.userId)
        : null;
      const currentCase = result.caseId ? caseById.get(result.caseId) : null;

      rows.push([
        "Результаты",
        result.idResult,
        result.place,
        result.title,
        team?.name ?? "",
        participant ? formatPersonName(participant.user) : "",
        currentCase?.title ?? "",
        result.score ?? "",
        result.description ?? "",
      ]);
    });
  }

  return rows;
}

export function AdminEventCsvExportModal({
  event,
  onClose,
}: AdminEventCsvExportModalProps) {
  const availableOptions = getAvailableOptions(event);
  const [selectedOptions, setSelectedOptions] =
    useState<ExportOption[]>(availableOptions);
  const { data: accessOptions } = useQuery({
    queryKey: ["admin-event-access", event.idEvent],
    queryFn: () =>
      eventService
        .getMyEventAdminAccessOptions(event.idEvent)
        .then((response) => response.data),
    enabled: event.permissions.hasFullAccess && selectedOptions.includes("eventAdmins"),
  });

  const toggleOption = (option: ExportOption) => {
    setSelectedOptions((currentOptions) =>
      currentOptions.includes(option)
        ? currentOptions.filter((currentOption) => currentOption !== option)
        : [...currentOptions, option],
    );
  };

  const exportCsv = () => {
    downloadCsv(
      `${event.slug || event.idEvent}-export.csv`,
      buildAdminEventCsvRows(event, selectedOptions, accessOptions),
    );
    onClose();
  };

  return (
    <CsvExportModalFrame
      title="Экспорт данных мероприятия"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={exportCsv}
          disabled={selectedOptions.length === 0}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Скачать CSV
        </button>
      }
    >
      <div className="space-y-3">
        {availableOptions.map((option) => (
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
    </CsvExportModalFrame>
  );
}
