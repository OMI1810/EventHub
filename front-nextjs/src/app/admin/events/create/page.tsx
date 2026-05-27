"use client";

import { MiniLoader } from "@/components/ui/MiniLoader";
import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import eventService from "@/services/event.service";
import {
  EventCaseDraft,
  EventCaseMaterialDraft,
  EventCreateDraft,
  EventCreateType,
  EventFeaturePreset,
  EventFormat,
  EventMaterialDraft,
  EventTagDraft,
  EventTagOption,
} from "@/types/event-create.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";

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

interface EventTypeOption {
  value: EventCreateType | "OTHER";
  label: string;
  description: string;
}

interface BaseEventForm {
  title: string;
  description: string;
  slug: string;
  organizationId: string;
  dataStart: string;
  dataEnd: string;
  dateDeadLine: string;
  format: EventFormat;
  address: string;
  cordinatX: number | null;
  cordinatY: number | null;
}

interface CaseSettingsForm {
  dateForStartSelected: string;
  dateForEndSelected: string;
  dateStopCode: string;
}

interface CaseModalForm {
  id?: string;
  holder: string;
  title: string;
  description: string;
  teamLimit: string;
  materialTitle: string;
  materialUrl: string;
  materials: EventCaseMaterialDraft[];
}

const eventTypeOptions: EventTypeOption[] = [
  {
    value: "HACKATHON",
    label: "Хакатон",
    description: "Кейсы, команды по кейсам, решения и результаты.",
  },
  {
    value: "MASTER_CLASS",
    label: "Мастер-класс",
    description: "Лимит участников и материалы мероприятия.",
  },
  {
    value: "CONTEST",
    label: "Конкурс",
    description: "Лимит участников, материалы, решения и результаты.",
  },
  {
    value: "OTHER",
    label: "Другое",
    description: "Будет доступно позже.",
  },
];

const presets: Record<EventCreateType, EventFeaturePreset> = {
  HACKATHON: {
    hasCases: true,
    hasTeams: true,
    hasParticipantLimit: false,
    hasLoadedSolution: true,
    hasMaterials: false,
    hasResualt: true,
  },
  MASTER_CLASS: {
    hasCases: false,
    hasTeams: false,
    hasParticipantLimit: true,
    hasLoadedSolution: false,
    hasMaterials: true,
    hasResualt: false,
  },
  CONTEST: {
    hasCases: false,
    hasTeams: false,
    hasParticipantLimit: true,
    hasLoadedSolution: true,
    hasMaterials: true,
    hasResualt: true,
  },
};

const initialBaseForm: BaseEventForm = {
  title: "",
  description: "",
  slug: "",
  organizationId: "",
  dataStart: "",
  dataEnd: "",
  dateDeadLine: "",
  format: "OFFLINE",
  address: "",
  cordinatX: null,
  cordinatY: null,
};

const initialCaseSettings: CaseSettingsForm = {
  dateForStartSelected: "",
  dateForEndSelected: "",
  dateStopCode: "",
};

const createEmptyCaseModal = (): CaseModalForm => ({
  holder: "",
  title: "",
  description: "",
  teamLimit: "",
  materialTitle: "",
  materialUrl: "",
  materials: [],
});

const createDraftId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeTagName = (value: string) => value.trim().toLowerCase();

export default function CreateEventPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<EventCreateType | null>(
    null,
  );
  const [step, setStep] = useState<"type" | "base" | "settings">("type");
  const [baseForm, setBaseForm] = useState<BaseEventForm>(initialBaseForm);
  const [selectedTags, setSelectedTags] = useState<EventTagDraft[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [caseSettings, setCaseSettings] =
    useState<CaseSettingsForm>(initialCaseSettings);
  const [cases, setCases] = useState<EventCaseDraft[]>([]);
  const [teamMemberLimit, setTeamMemberLimit] = useState("");
  const [participantLimit, setParticipantLimit] = useState("");
  const [eventMaterials, setEventMaterials] = useState<EventMaterialDraft[]>(
    [],
  );
  const [materialForm, setMaterialForm] = useState({ title: "", url: "" });
  const [caseModal, setCaseModal] = useState<CaseModalForm | null>(null);

  const { data: options, isLoading: isOptionsLoading } = useQuery({
    queryKey: ["event-create-options"],
    queryFn: () => eventService.getCreateOptions(),
  });

  const organizations = options?.data.organizations ?? [];
  const availableTags = options?.data.tags ?? [];
  const features = selectedType ? presets[selectedType] : null;

  const filteredTags = useMemo(() => {
    const query = normalizeTagName(tagSearch);

    return availableTags.filter((tag) => {
      const alreadySelected = selectedTags.some((selectedTag) => {
        if (selectedTag.id && selectedTag.id === tag.idTag) return true;
        return (
          normalizeTagName(selectedTag.name) === normalizeTagName(tag.name)
        );
      });

      if (alreadySelected) return false;
      if (!query) return true;

      return normalizeTagName(tag.name).includes(query);
    });
  }, [availableTags, selectedTags, tagSearch]);

  const selectedTypeLabel = useMemo(() => {
    return eventTypeOptions.find((option) => option.value === selectedType)
      ?.label;
  }, [selectedType]);

  const { mutate: createEvent, isPending: isCreating } = useMutation({
    mutationKey: ["create-event"],
    mutationFn: (data: EventCreateDraft) => eventService.create(data),
    onSuccess() {
      router.push("/");
      toast.success("Мероприятие создано");
    },
    onError(error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ?? "Не удалось создать мероприятие",
        );
        return;
      }

      toast.error("Не удалось создать мероприятие");
    },
  });

  const updateBaseForm = (field: keyof BaseEventForm, value: string) => {
    setBaseForm((current) => ({ ...current, [field]: value }));
  };

  const updateFormat = (format: EventFormat) => {
    setBaseForm((current) => ({
      ...current,
      format,
      address: format === "ONLINE" ? "" : current.address,
      cordinatX: format === "ONLINE" ? null : current.cordinatX,
      cordinatY: format === "ONLINE" ? null : current.cordinatY,
    }));
  };

  const selectType = (type: EventCreateType) => {
    setSelectedType(type);
    setStep("base");
    setBaseForm((current) => ({
      ...current,
      dateDeadLine: type === "CONTEST" ? current.dateDeadLine : "",
    }));
  };

  const submitBaseSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStep("settings");
  };

  const addTag = (tag: EventTagDraft) => {
    const normalizedName = normalizeTagName(tag.name);
    const isSelected = selectedTags.some((selectedTag) => {
      if (tag.id && selectedTag.id === tag.id) return true;
      return normalizeTagName(selectedTag.name) === normalizedName;
    });

    if (isSelected || !normalizedName) return;

    setSelectedTags((current) => [...current, tag]);
    setTagSearch("");
    setIsTagDropdownOpen(false);
  };

  const addTagFromSearch = () => {
    const name = tagSearch.trim();

    if (!name) return;

    const existingTag = availableTags.find(
      (tag) => normalizeTagName(tag.name) === normalizeTagName(name),
    );

    addTag(
      existingTag
        ? { id: existingTag.idTag, name: existingTag.name }
        : { name },
    );
  };

  const removeTag = (tag: EventTagDraft) => {
    setSelectedTags((current) =>
      current.filter((item) => {
        if (tag.id) return item.id !== tag.id;
        return normalizeTagName(item.name) !== normalizeTagName(tag.name);
      }),
    );
  };

  const addMaterial = () => {
    if (!materialForm.title.trim() || !materialForm.url.trim()) return;

    setEventMaterials((current) => [
      ...current,
      {
        id: createDraftId(),
        title: materialForm.title.trim(),
        url: materialForm.url.trim(),
      },
    ]);
    setMaterialForm({ title: "", url: "" });
  };

  const removeEventMaterial = (id: string) => {
    setEventMaterials((current) =>
      current.filter((material) => material.id !== id),
    );
  };

  const saveCase = () => {
    if (!caseModal?.holder.trim() || !caseModal.title.trim()) return;

    const nextCase: EventCaseDraft = {
      id: caseModal.id ?? createDraftId(),
      holder: caseModal.holder.trim(),
      title: caseModal.title.trim(),
      description: caseModal.description.trim() || undefined,
      teamLimit: caseModal.teamLimit ? Number(caseModal.teamLimit) : undefined,
      materials: caseModal.materials,
    };

    setCases((current) => {
      if (!caseModal.id) return [...current, nextCase];

      return current.map((eventCase) =>
        eventCase.id === caseModal.id ? nextCase : eventCase,
      );
    });
    setCaseModal(null);
  };

  const editCase = (eventCase: EventCaseDraft) => {
    setCaseModal({
      id: eventCase.id,
      holder: eventCase.holder,
      title: eventCase.title,
      description: eventCase.description ?? "",
      teamLimit: eventCase.teamLimit ? String(eventCase.teamLimit) : "",
      materialTitle: "",
      materialUrl: "",
      materials: eventCase.materials,
    });
  };

  const removeCase = (id: string) => {
    setCases((current) => current.filter((eventCase) => eventCase.id !== id));
  };

  const submitEvent = () => {
    if (!selectedType || !features) return;

    const payload: EventCreateDraft = {
      type: selectedType,
      title: baseForm.title,
      description: baseForm.description || undefined,
      slug: baseForm.slug,
      organizationId: baseForm.organizationId,
      dataStart: baseForm.dataStart,
      dataEnd: baseForm.dataEnd,
      dateDeadLine:
        selectedType === "CONTEST" ? baseForm.dateDeadLine : undefined,
      format: baseForm.format,
      address: baseForm.address,
      cordinatX: baseForm.cordinatX ?? undefined,
      cordinatY: baseForm.cordinatY ?? undefined,
      tags: selectedTags,
      participantLimit:
        features.hasParticipantLimit && participantLimit
          ? Number(participantLimit)
          : undefined,
      teamMemberLimit:
        features.hasTeams && teamMemberLimit
          ? Number(teamMemberLimit)
          : undefined,
      caseSettings: features.hasCases ? caseSettings : undefined,
      cases: features.hasCases
        ? cases.map(({ id: _id, materials, ...eventCase }) => ({
            ...eventCase,
            materials: materials.map(
              ({ id: _materialId, ...material }) => material,
            ),
          }))
        : undefined,
      eventMaterials: features.hasMaterials
        ? eventMaterials.map(({ id: _id, ...material }) => material)
        : undefined,
    };

    createEvent(payload);
  };

  return (
    <section className="w-full max-w-6xl text-white">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">Администрирование</p>
        <h1 className="mt-2 text-3xl font-semibold">Создание мероприятия</h1>
      </div>

      {step === "type" && (
        <div className="grid gap-3 md:grid-cols-2">
          {eventTypeOptions.map((option) => {
            const isDisabled = option.value === "OTHER";

            return (
              <button
                key={option.value}
                type="button"
                disabled={isDisabled}
                onClick={() =>
                  !isDisabled && selectType(option.value as EventCreateType)
                }
                className={twMerge(
                  "rounded-md border border-zinc-700 bg-zinc-900/60 p-4 text-left transition hover:border-primary",
                  isDisabled &&
                    "cursor-not-allowed opacity-50 hover:border-zinc-700",
                )}
              >
                <span className="text-lg font-medium">{option.label}</span>
                <span className="mt-2 block text-sm text-zinc-400">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {step === "base" && selectedType && (
        <form onSubmit={submitBaseSettings} className="grid gap-5">
          <div className="rounded-md border border-zinc-700 bg-zinc-900/60 p-4">
            <p className="text-sm text-zinc-400">Тип мероприятия</p>
            <p className="mt-1 text-xl font-medium">{selectedTypeLabel}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Название"
              value={baseForm.title}
              onChange={(value) => updateBaseForm("title", value)}
              required
            />
            <TextField
              label="Slug"
              value={baseForm.slug}
              onChange={(value) => updateBaseForm("slug", value)}
              required
            />
            <div className="md:col-span-2">
              <TextAreaField
                label="Описание"
                value={baseForm.description}
                onChange={(value) => updateBaseForm("description", value)}
              />
            </div>
            <SelectField
              label="Организация"
              value={baseForm.organizationId}
              onChange={(value) => updateBaseForm("organizationId", value)}
              required
            >
              <option value="">
                {isOptionsLoading ? "Загрузка..." : "Выберите организацию"}
              </option>
              {organizations.map((organization) => (
                <option
                  key={organization.idOrganization}
                  value={organization.idOrganization}
                >
                  {organization.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Формат"
              value={baseForm.format}
              onChange={(value) => updateFormat(value as EventFormat)}
            >
              <option value="OFFLINE">Офлайн</option>
              <option value="ONLINE">Онлайн</option>
              <option value="HYBRID">Гибрид</option>
            </SelectField>
            <TextField
              label="Дата и время начала"
              type="datetime-local"
              value={baseForm.dataStart}
              onChange={(value) => updateBaseForm("dataStart", value)}
              required
            />
            <TextField
              label="Дата и время завершения"
              type="datetime-local"
              value={baseForm.dataEnd}
              onChange={(value) => updateBaseForm("dataEnd", value)}
              required
            />
            {selectedType === "CONTEST" && (
              <TextField
                label="Дедлайн сдачи решения"
                type="datetime-local"
                value={baseForm.dateDeadLine}
                onChange={(value) => updateBaseForm("dateDeadLine", value)}
                required
              />
            )}
            {baseForm.format !== "ONLINE" && (
              <>
            <AddressAutocomplete
              label="Адрес"
              value={baseForm.address}
              required
              onManualChange={(address) =>
                setBaseForm((current) => ({
                  ...current,
                  address,
                  cordinatX: null,
                  cordinatY: null,
                }))
              }
              onSelect={(address) =>
                setBaseForm((current) => ({
                  ...current,
                  address: address.address,
                  cordinatX: address.cordinatX,
                  cordinatY: address.cordinatY,
                }))
              }
            />
                <div className="md:col-span-2">
                  <ArcGisPointMap
                    cordinatX={baseForm.cordinatX}
                    cordinatY={baseForm.cordinatY}
                  />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <TagCombobox
                filteredTags={filteredTags}
                isOpen={isTagDropdownOpen}
                search={tagSearch}
                selectedTags={selectedTags}
                onAddFromSearch={addTagFromSearch}
                onInputFocus={() => setIsTagDropdownOpen(true)}
                onRemoveTag={removeTag}
                onSearchChange={(value) => {
                  setTagSearch(value);
                  setIsTagDropdownOpen(true);
                }}
                onSelectTag={(tag) => addTag({ id: tag.idTag, name: tag.name })}
              />
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("type")}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
            >
              Назад
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Далее
            </button>
          </div>
        </form>
      )}

      {step === "settings" && selectedType && features && (
        <div className="grid gap-4">
          {features.hasCases && (
            <Panel title="Кейсы">
              <div className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="Начало выбора кейсов"
                  type="datetime-local"
                  value={caseSettings.dateForStartSelected}
                  onChange={(value) =>
                    setCaseSettings((current) => ({
                      ...current,
                      dateForStartSelected: value,
                    }))
                  }
                  required
                />
                <TextField
                  label="Конец выбора кейсов"
                  type="datetime-local"
                  value={caseSettings.dateForEndSelected}
                  onChange={(value) =>
                    setCaseSettings((current) => ({
                      ...current,
                      dateForEndSelected: value,
                    }))
                  }
                  required
                />
                <TextField
                  label="Стоп-код"
                  type="datetime-local"
                  value={caseSettings.dateStopCode}
                  onChange={(value) =>
                    setCaseSettings((current) => ({
                      ...current,
                      dateStopCode: value,
                    }))
                  }
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setCaseModal(createEmptyCaseModal())}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium"
              >
                Добавить кейс
              </button>
              <ScrollList className="mt-4 h-72">
                {cases.map((eventCase) => (
                  <div
                    key={eventCase.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-zinc-700 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{eventCase.title}</p>
                      <p className="text-sm text-zinc-400">
                        {eventCase.holder}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Материалов: {eventCase.materials.length}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => editCase(eventCase)}
                        className="rounded-md border border-zinc-700 px-3 py-1 text-sm"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCase(eventCase.id)}
                        className="rounded-md border border-red-500 px-3 py-1 text-sm text-red-300"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </ScrollList>
            </Panel>
          )}

          {features.hasTeams && (
            <Panel title="Команды">
              <TextField
                label="Количество участников в команде"
                type="number"
                value={teamMemberLimit}
                onChange={setTeamMemberLimit}
                min={1}
              />
            </Panel>
          )}

          {features.hasParticipantLimit && (
            <Panel title="Лимит участников">
              <TextField
                label="Общий лимит участников"
                type="number"
                value={participantLimit}
                onChange={setParticipantLimit}
                min={1}
              />
            </Panel>
          )}

          {features.hasMaterials && (
            <Panel title="Материалы мероприятия">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <TextField
                  label="Название"
                  value={materialForm.title}
                  onChange={(value) =>
                    setMaterialForm((current) => ({ ...current, title: value }))
                  }
                />
                <TextField
                  label="Ссылка"
                  value={materialForm.url}
                  onChange={(value) =>
                    setMaterialForm((current) => ({ ...current, url: value }))
                  }
                />
                <button
                  type="button"
                  onClick={addMaterial}
                  className="self-end rounded-md bg-primary px-4 py-2 text-sm font-medium"
                >
                  Добавить
                </button>
              </div>
              <ScrollList className="mt-3 h-52">
                {eventMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-zinc-700 p-3 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {material.title}: {material.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEventMaterial(material.id)}
                      className="shrink-0 text-red-300"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </ScrollList>
            </Panel>
          )}

          {features.hasLoadedSolution && (
            <Panel title="Загрузка решений">
              <p className="text-sm text-zinc-300">
                Загрузка решений включена.
              </p>
            </Panel>
          )}

          {features.hasResualt && (
            <Panel title="Результаты">
              <p className="text-sm text-zinc-300">
                Публикация результатов включена.
              </p>
            </Panel>
          )}

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("base")}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={submitEvent}
              disabled={isCreating}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {isCreating ? <MiniLoader /> : "Создать мероприятие"}
            </button>
          </div>
        </div>
      )}

      {caseModal && (
        <CaseModal
          form={caseModal}
          onChange={setCaseModal}
          onClose={() => setCaseModal(null)}
          onSave={saveCase}
        />
      )}
    </section>
  );
}

function TagCombobox({
  filteredTags,
  isOpen,
  search,
  selectedTags,
  onAddFromSearch,
  onInputFocus,
  onRemoveTag,
  onSearchChange,
  onSelectTag,
}: {
  filteredTags: EventTagOption[];
  isOpen: boolean;
  search: string;
  selectedTags: EventTagDraft[];
  onAddFromSearch: () => void;
  onInputFocus: () => void;
  onRemoveTag: (tag: EventTagDraft) => void;
  onSearchChange: (value: string) => void;
  onSelectTag: (tag: EventTagOption) => void;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-zinc-300">Теги</p>
      <div className="relative">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={onInputFocus}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onAddFromSearch();
            }}
            placeholder="Введите тег"
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={onAddFromSearch}
            disabled={!search.trim()}
            className="rounded-md bg-primary px-4 py-2 text-lg font-semibold disabled:opacity-50"
          >
            +
          </button>
        </div>
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-52 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
            {filteredTags.length > 0 ? (
              <div className="grid gap-1">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.idTag}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onSelectTag(tag);
                    }}
                    className="rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-800"
                  >
                    <span>{tag.name}</span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {tag.type === "SYSTEM" ? "системный" : "мой"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-3 py-2 text-sm text-zinc-500">
                Ничего не найдено. Нажмите +, чтобы добавить новый тег.
              </p>
            )}
          </div>
        )}
      </div>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <button
              key={tag.id ?? tag.name}
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-100 hover:border-red-400 hover:text-red-200"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-md border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ScrollList({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div
      className={twMerge(
        "overflow-y-auto rounded-md border border-zinc-800 p-2",
        className,
      )}
    >
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      {label}
      <input
        type={type}
        required={required}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
      />
    </label>
  );
}

function SelectField({
  children,
  label,
  value,
  onChange,
  required,
}: {
  children: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      {label}
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
      >
        {children}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      {label}
      <textarea
        value={value}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
      />
    </label>
  );
}

function CaseModal({
  form,
  onChange,
  onClose,
  onSave,
}: {
  form: CaseModalForm;
  onChange: (form: CaseModalForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const update = (field: keyof CaseModalForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  const addCaseMaterial = () => {
    if (!form.materialTitle.trim() || !form.materialUrl.trim()) return;

    onChange({
      ...form,
      materialTitle: "",
      materialUrl: "",
      materials: [
        ...form.materials,
        {
          id: createDraftId(),
          title: form.materialTitle.trim(),
          url: form.materialUrl.trim(),
        },
      ],
    });
  };

  const removeCaseMaterial = (id?: string) => {
    onChange({
      ...form,
      materials: form.materials.filter((material) => material.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-md border border-zinc-700 bg-zinc-950 p-5 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {form.id ? "Редактирование кейса" : "Новый кейс"}
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-400">
            Закрыть
          </button>
        </div>

        <div className="mx-auto mt-5 grid max-h-[70vh] w-full max-w-lg gap-4 overflow-y-auto pr-2">
          <TextField
            label="Кейсодержатель"
            value={form.holder}
            onChange={(value) => update("holder", value)}
            required
          />
          <TextField
            label="Название"
            value={form.title}
            onChange={(value) => update("title", value)}
            required
          />
          <TextAreaField
            label="Описание"
            value={form.description}
            onChange={(value) => update("description", value)}
          />
          <div className="max-w-56">
            <TextField
              label="Количество команд"
              type="number"
              value={form.teamLimit}
              onChange={(value) => update("teamLimit", value)}
              min={1}
            />
          </div>
          <div className="grid gap-3">
            <p className="text-sm text-zinc-300">Материалы кейса</p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="w-full md:w-44">
                <TextField
                label="Название"
                value={form.materialTitle}
                  onChange={(value) => update("materialTitle", value)}
                />
              </div>
              <div className="w-full md:w-48">
                <TextField
                label="Ссылка"
                value={form.materialUrl}
                  onChange={(value) => update("materialUrl", value)}
                />
              </div>
              <button
                type="button"
                onClick={addCaseMaterial}
                className="h-10 w-full rounded-md border border-zinc-700 px-4 text-sm md:w-14"
              >
                +
              </button>
            </div>
            <ScrollList className="h-40">
              {form.materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-zinc-900 p-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {material.title}: {material.url}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCaseMaterial(material.id)}
                    className="shrink-0 text-red-300"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </ScrollList>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
