"use client";

import {
  ManagedEventDetails,
  ManagedEventTeam,
} from "@/types/event-management.types";
import { useState } from "react";

type ExportOption = "participants" | "teams" | "cases";

interface AdminEventCsvExportModalProps {
  event: ManagedEventDetails;
  onClose: () => void;
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

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildAdminEventCsvRows(
  event: ManagedEventDetails,
  selectedOptions: ExportOption[],
) {
  const caseById = new Map(
    event.cases.map((eventCase) => [eventCase.idCase, eventCase]),
  );
  const rows: string[][] = [];

  if (selectedOptions.includes("participants")) {
    rows.push(["Участники", "ФИО", "Команда", "Роль", "Кейс"]);
    if (event.hasTeams) {
      event.teams.forEach((team) => {
        const currentCase = team.caseId ? caseById.get(team.caseId) : null;
        team.members.forEach((member) => {
          rows.push([
            "Участники",
            formatPersonName(member.user),
            team.name,
            isCaptain(team, member.user.idUser) ? "Капитан" : "Участник",
            currentCase?.title ?? "",
          ]);
        });
      });
    } else {
      event.participant.forEach((participant) => {
        rows.push([
          "Участники",
          formatPersonName(participant.user),
          "",
          "Участник",
          "",
        ]);
      });
    }
  }

  if (selectedOptions.includes("teams")) {
    rows.push(["Команды", "Название", "Капитан", "Участники", "Кейс"]);
    event.teams.forEach((team) => {
      const currentCase = team.caseId ? caseById.get(team.caseId) : null;
      rows.push([
        "Команды",
        team.name,
        formatPersonName(team.caption),
        team.members.map((member) => formatPersonName(member.user)).join(", "),
        currentCase?.title ?? "",
      ]);
    });
  }

  if (selectedOptions.includes("cases")) {
    rows.push(["Кейсы", "Название", "Команды", "Участники", ""]);
    event.cases.forEach((eventCase) => {
      const assignedTeams = event.teams.filter(
        (team) => team.caseId === eventCase.idCase,
      );
      rows.push([
        "Кейсы",
        eventCase.title,
        assignedTeams.map((team) => team.name).join(", "),
        assignedTeams
          .flatMap((team) =>
            team.members.map((member) => formatPersonName(member.user)),
          )
          .join(", "),
        "",
      ]);
    });
  }

  return rows;
}

export function AdminEventCsvExportModal({
  event,
  onClose,
}: AdminEventCsvExportModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<ExportOption[]>([
    "participants",
  ]);

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
      buildAdminEventCsvRows(event, selectedOptions),
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            Экспорт данных
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
          {[
            ["participants", "Участники: полная таблица всех участников"],
            ["teams", "Команды: название, участники, капитан"],
            ["cases", "Кейсы: распределение команд по кейсам"],
          ].map(([option, label]) => (
            <label
              key={option}
              className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-100"
            >
              <input
                type="checkbox"
                checked={selectedOptions.includes(option as ExportOption)}
                onChange={() => toggleOption(option as ExportOption)}
                className="h-4 w-4"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={exportCsv}
            disabled={selectedOptions.length === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Скачать CSV
          </button>
        </div>
      </div>
    </div>
  );
}
