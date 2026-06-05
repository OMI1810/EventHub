"use client";

import { MiniLoader } from "@/components/ui/MiniLoader";
import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { ADMIN_PAGES } from "@/config/pages/admin.config";
import eventService from "@/services/event.service";
import {
  EventCaseDraft,
  EventCaseMaterialDraft,
  EventCreateDraft,
  EventCreateType,
  EventFeaturePreset,
  EventFormat,
  EventMaterialDraft,
  EventPublicationStatus,
  EventTagDraft,
  EventTagOption,
} from "@/types/event-create.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
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

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

interface EventTypeOption {
  value: EventCreateType | "OTHER";
  label: string;
  description: string;
  highlights: string[];
  accent?: "default" | "primary";
}

interface BaseEventForm {
  title: string;
  description: string;
  slug: string;
  organizationId: string;
  dataStart: string;
  dataEnd: string;
  status: EventPublicationStatus;
  dataStartRegistration: string;
  dataEndRegistration: string;
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
  tagSearch: string;
  isTagDropdownOpen: boolean;
  tags: EventTagDraft[];
  materials: EventCaseMaterialDraft[];
}

interface CustomEventTypeModalForm {
  typeName: string;
  features: EventFeaturePreset;
}

const eventTypeOptions: EventTypeOption[] = [
  {
    value: "HACKATHON",
    label: "Хакатон",
    description: "Кейсы, командная механика и полноценная соревновательная структура.",
    highlights: ["Кейсы", "Команды", "Загрузка решений"],
    accent: "primary",
  },
  {
    value: "MASTER_CLASS",
    label: "Мастер-класс",
    description: "Более простой сценарий с материалами и ограничением по участникам.",
    highlights: ["Материалы", "Лимит участников", "Без команд"],
    accent: "primary",
  },
  {
    value: "CONTEST",
    label: "Конкурс",
    description: "Индивидуальный формат с загрузкой решений и итоговой таблицей.",
    highlights: ["Лимит участников", "Загрузка решений", "Итоги"],
    accent: "primary",
  },
  {
    value: "OTHER",
    label: "Другое",
    description: "Соберите собственный тип мероприятия из нужных вам модулей.",
    highlights: ["Гибкие настройки", "Свои модули", "Предпросмотр структуры"],
  },
];

const customFeatureGroups: Array<{
  title: string;
  description: string;
  items: Array<{
    key: keyof EventFeaturePreset;
    label: string;
    description: string;
  }>;
}> = [
  {
    title: "Командная механика",
    description: "Определяет, как участники объединяются и взаимодействуют внутри события.",
    items: [
      {
        key: "hasTeams",
        label: "Команды",
        description: "Участники смогут собираться в команды и работать вместе.",
      },
      {
        key: "hasCases",
        label: "Кейсы",
        description: "В событии появится сценарий выбора кейса и связанный поток работы.",
      },
    ],
  },
  {
    title: "Контент и работа участников",
    description: "Материалы и действия, которые будут доступны пользователям во время события.",
    items: [
      {
        key: "hasMaterials",
        label: "Материалы мероприятия",
        description: "Администратор сможет публиковать материалы для участников.",
      },
      {
        key: "hasLoadedSolution",
        label: "Загрузка решений",
        description: "Участники смогут отправлять свои решения внутри мероприятия.",
      },
    ],
  },
  {
    title: "Ограничения и результаты",
    description: "Настройки, влияющие на вместимость и финальную выдачу результатов.",
    items: [
      {
        key: "hasParticipantLimit",
        label: "Общий лимит участников",
        description: "Для мероприятия можно будет задать ограничение по количеству мест.",
      },
      {
        key: "hasResualt",
        label: "Вкладка итоги",
        description: "В мероприятии будет доступен блок публикации итогов.",
      },
    ],
  },
  {
    title: "Проход и доступ",
    description: "Инфраструктурные настройки для офлайн-сценариев и прохода на площадку.",
    items: [
      {
        key: "hasEntryPass",
        label: "QR-пропуск",
        description: "Для участников можно будет использовать одноразовый QR-пропуск на вход.",
      },
    ],
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
    hasEntryPass: false,
  },
  MASTER_CLASS: {
    hasCases: false,
    hasTeams: false,
    hasParticipantLimit: true,
    hasLoadedSolution: false,
    hasMaterials: true,
    hasResualt: false,
    hasEntryPass: false,
  },
  CONTEST: {
    hasCases: false,
    hasTeams: false,
    hasParticipantLimit: true,
    hasLoadedSolution: true,
    hasMaterials: true,
    hasResualt: true,
    hasEntryPass: false,
  },
};

const initialBaseForm: BaseEventForm = {
  title: "",
  description: "",
  slug: "",
  organizationId: "",
  dataStart: "",
  dataEnd: "",
  status: "PRIVATE",
  dataStartRegistration: "",
  dataEndRegistration: "",
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
  tagSearch: "",
  isTagDropdownOpen: false,
  tags: [],
  materials: [],
});

const createCustomEventTypeModal = (): CustomEventTypeModalForm => ({
  typeName: "",
  features: {
    hasCases: false,
    hasTeams: false,
    hasParticipantLimit: false,
    hasLoadedSolution: false,
    hasMaterials: false,
    hasResualt: false,
    hasEntryPass: false,
  },
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
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] =
    useState<EventFeaturePreset | null>(null);
  const [step, setStep] = useState<"type" | "base" | "settings">("type");
  const [baseForm, setBaseForm] = useState<BaseEventForm>(initialBaseForm);
  const [isSlugTouched, setIsSlugTouched] = useState(false);
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
  const [customTypeModal, setCustomTypeModal] =
    useState<CustomEventTypeModalForm | null>(null);

  const { data: options, isLoading: isOptionsLoading } = useQuery({
    queryKey: ["event-create-options"],
    queryFn: () => eventService.getCreateOptions(),
  });

  const organizations = options?.data.organizations ?? [];
  const availableTags = options?.data.tags ?? [];
  const features = selectedFeatures;

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
    return (
      eventTypeOptions.find((option) => option.value === selectedType)?.label ??
      selectedType
    );
  }, [selectedType]);

  const selectedFeatureLabels = useMemo(() => {
    if (!features) return [];

    return customFeatureGroups
      .flatMap((group) => group.items)
      .filter((item) => features[item.key])
      .map((item) => item.label);
  }, [features]);

  const { mutate: createEvent, isPending: isCreating } = useMutation({
    mutationKey: ["create-event"],
    mutationFn: (data: EventCreateDraft) => eventService.create(data),
    onSuccess() {
      router.push(ADMIN_PAGES.EVENTS);
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
    setBaseForm((current) => {
      if (field === "title" && !isSlugTouched) {
        return {
          ...current,
          title: value,
          slug: toSlug(value),
        };
      }

      if (field === "slug") {
        return {
          ...current,
          slug: toSlug(value),
        };
      }

      return { ...current, [field]: value };
    });
  };

  const updateOrganization = (organizationId: string) => {
    const organization = organizations.find(
      (currentOrganization) =>
        currentOrganization.idOrganization === organizationId,
    );

    setBaseForm((current) => ({
      ...current,
      organizationId,
      address:
        current.format !== "ONLINE" && organization?.address
          ? organization.address
          : current.address,
      cordinatX:
        current.format !== "ONLINE" && organization?.cordinatX !== undefined
          ? organization.cordinatX
          : current.cordinatX,
      cordinatY:
        current.format !== "ONLINE" && organization?.cordinatY !== undefined
          ? organization.cordinatY
          : current.cordinatY,
    }));
  };

  const updateFormat = (format: EventFormat) => {
    setBaseForm((current) => {
      const organization = organizations.find(
        (currentOrganization) =>
          currentOrganization.idOrganization === current.organizationId,
      );
      const isOnline = format === "ONLINE";

      return {
        ...current,
        format,
        address: isOnline ? "" : organization?.address ?? current.address,
        cordinatX: isOnline
          ? null
          : organization?.cordinatX !== undefined
            ? organization.cordinatX
            : current.cordinatX,
        cordinatY: isOnline
          ? null
          : organization?.cordinatY !== undefined
            ? organization.cordinatY
            : current.cordinatY,
      };
    });
  };

  const selectType = (type: EventCreateType) => {
    setSelectedType(type);
    setSelectedFeatures(presets[type]);
    setStep("base");
    setBaseForm((current) => ({
      ...current,
      dateDeadLine: type === "CONTEST" ? current.dateDeadLine : "",
    }));
  };

  const updateStatus = (status: EventPublicationStatus) => {
    setBaseForm((current) => ({
      ...current,
      status,
      dataStartRegistration:
        status === "PUBLIC" ? current.dataStartRegistration : "",
      dataEndRegistration: status === "PUBLIC" ? current.dataEndRegistration : "",
    }));
  };

  const openCustomTypeModal = () => {
    setCustomTypeModal(createCustomEventTypeModal());
  };

  const applyCustomType = () => {
    const typeName = customTypeModal?.typeName.trim();

    if (!typeName || !customTypeModal) {
      toast.error("Укажите вид мероприятия");
      return;
    }

    setSelectedType(typeName);
    setSelectedFeatures(customTypeModal.features);
    setCustomTypeModal(null);
    setStep("base");
  };

  const submitBaseSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!baseForm.organizationId) {
      toast.error("Выберите организацию");
      return;
    }

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
      tags: caseModal.tags,
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
      tagSearch: "",
      isTagDropdownOpen: false,
      tags: eventCase.tags,
      materials: eventCase.materials,
    });
  };

  const removeCase = (id: string) => {
    setCases((current) => current.filter((eventCase) => eventCase.id !== id));
  };

  const submitEvent = () => {
    if (!selectedType || !features) return;

    const shouldSendDeadline =
      selectedType === "CONTEST" ||
      (features.hasLoadedSolution && !features.hasCases);
    const caseSettingsPayload = features.hasCases
      ? {
          dateForStartSelected:
            toIsoDateTime(caseSettings.dateForStartSelected) ?? "",
          dateForEndSelected:
            toIsoDateTime(caseSettings.dateForEndSelected) ?? "",
          dateStopCode: features.hasLoadedSolution
            ? toIsoDateTime(caseSettings.dateStopCode)
            : undefined,
        }
      : undefined;

    const payload: EventCreateDraft = {
      type: selectedType,
      hasCases: features.hasCases,
      hasTeams: features.hasTeams,
      hasParticipantLimit: features.hasParticipantLimit,
      hasLoadedSolution: features.hasLoadedSolution,
      hasMaterials: features.hasMaterials,
      hasResualt: features.hasResualt,
      hasEntryPass: features.hasEntryPass,
      title: baseForm.title,
      description: baseForm.description || undefined,
      slug: baseForm.slug,
      organizationId: baseForm.organizationId,
      dataStart: toIsoDateTime(baseForm.dataStart) ?? "",
      dataEnd: toIsoDateTime(baseForm.dataEnd) ?? "",
      status: baseForm.status,
      dataStartRegistration:
        baseForm.status === "PUBLIC"
          ? toIsoDateTime(baseForm.dataStartRegistration)
          : undefined,
      dataEndRegistration:
        baseForm.status === "PUBLIC"
          ? toIsoDateTime(baseForm.dataEndRegistration)
          : undefined,
      dateDeadLine: shouldSendDeadline
        ? toIsoDateTime(baseForm.dateDeadLine)
        : undefined,
      format: baseForm.format,
      address: baseForm.format === "ONLINE" ? "Онлайн" : baseForm.address,
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
      caseSettings: caseSettingsPayload,
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
    <section className="w-full min-w-0 max-w-none overflow-x-hidden text-white">
      <div className="mb-6 min-w-0 sm:mb-8">
        <p className="text-sm text-zinc-400">Администрирование</p>
        <h1 className="mt-2 break-words text-3xl font-semibold">
          Создание мероприятия
        </h1>
      </div>

      {step === "type" && (
        <div className="grid gap-6">
          <section className="min-w-0 rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-4 sm:p-6 md:p-8">
            <div className="min-w-0 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                Шаг 1
              </p>
              <h2 className="mt-3 break-words text-2xl font-semibold text-zinc-50">
                Выберите основу мероприятия
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Начните с готового сценария, если он подходит под ваш формат, либо
                соберите собственный тип мероприятия с нужными модулями и
                возможностями.
              </p>
            </div>

            <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2">
              {eventTypeOptions.map((option) => {
                const isPrimary = option.accent === "primary";

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      option.value === "OTHER"
                        ? openCustomTypeModal()
                        : selectType(option.value)
                    }
                    className={twMerge(
                      "group relative min-w-0 rounded-[1.75rem] border bg-zinc-950/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900 sm:p-5",
                      isPrimary
                        ? "border-zinc-700"
                        : "border-zinc-800",
                    )}
                  >
                    <div className="min-w-0 pr-36 sm:pr-44">
                      <span className="block break-words text-xl font-semibold text-zinc-50 sm:text-2xl">
                        {option.label}
                      </span>
                    </div>

                    {isPrimary ? (
                      <span className="absolute right-4 top-4 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-200 sm:right-5 sm:top-5 sm:px-3 sm:text-xs sm:tracking-[0.18em]">
                        Базовый сценарий
                      </span>
                    ) : (
                      <span className="absolute right-4 top-4 inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-300 sm:right-5 sm:top-5 sm:px-3 sm:text-xs sm:tracking-[0.18em]">
                        Гибкая настройка
                      </span>
                    )}

                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                      {option.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {option.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {step === "base" && selectedType && features && (
        <form onSubmit={submitBaseSettings} className="grid gap-6">
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-4 sm:p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                Шаг 2
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-zinc-50">
                Базовая структура мероприятия
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Теперь задайте основную информацию о событии: как оно будет
                называться, где и когда пройдёт, в каком формате публикуется и
                по каким тегам его смогут находить.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Выбранный шаблон
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-xl font-semibold text-zinc-50">
                {selectedTypeLabel}
              </p>
              {selectedFeatureLabels.length > 0 ? (
                selectedFeatureLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-zinc-700 bg-zinc-950/80 px-3 py-1 text-xs text-zinc-300"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-3 py-1 text-xs text-zinc-300">
                  Без дополнительных модулей
                </span>
              )}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
            <Panel title="Базовая информация">
              <div className="grid gap-4 xl:grid-cols-3 xl:auto-rows-min">
                <div className="md:col-span-2">
                  <TextField
                    label="Название"
                    value={baseForm.title}
                    onChange={(value) => updateBaseForm("title", value)}
                    required
                  />
                </div>
                <TextField
                  label="Slug"
                  value={baseForm.slug}
                  onChange={(value) => {
                    setIsSlugTouched(true);
                    updateBaseForm("slug", value);
                  }}
                  required
                />
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400 xl:col-span-1">
                  Короткая ссылка формируется из названия, но вы можете
                  отредактировать её вручную.
                </div>
                <div className="xl:col-span-3">
                  <TextAreaField
                    label="Описание"
                    value={baseForm.description}
                    onChange={(value) => updateBaseForm("description", value)}
                    rows={8}
                    resize="none"
                  />
                </div>
              </div>
            </Panel>

            <Panel title="Публикация и формат">
              <div className="grid gap-4 content-start">
                <div className="grid gap-2">
                  <p className="text-sm text-zinc-300">Организация</p>
                  {isOptionsLoading ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4 text-sm text-zinc-400">
                      Загрузка организаций...
                    </div>
                  ) : (
                    <ScrollList className="max-h-72">
                      <div className="grid gap-2">
                        {organizations.map((organization) => {
                          const isSelected =
                            baseForm.organizationId ===
                            organization.idOrganization;

                          return (
                            <button
                              key={organization.idOrganization}
                              type="button"
                              onClick={() =>
                                updateOrganization(organization.idOrganization)
                              }
                              className={twMerge(
                                "w-full min-w-0 rounded-2xl border px-4 py-3 text-left transition",
                                isSelected
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                                  : "border-zinc-800 bg-zinc-950/70 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900",
                              )}
                            >
                              <p className="font-medium">{organization.name}</p>
                              <p className="mt-1 text-sm text-zinc-400">
                                {organization.address || "Адрес организации пока не указан"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </ScrollList>
                  )}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <SegmentedControl
                    label="Формат"
                    value={baseForm.format}
                    onChange={(value) => updateFormat(value as EventFormat)}
                    options={[
                      { value: "OFFLINE", label: "Офлайн" },
                      { value: "ONLINE", label: "Онлайн" },
                      { value: "HYBRID", label: "Гибрид" },
                    ]}
                  />
                  <SegmentedControl
                    label="Статус"
                    value={baseForm.status}
                    onChange={(value) =>
                      updateStatus(value as EventPublicationStatus)
                    }
                    options={[
                      { value: "PRIVATE", label: "Приватное" },
                      { value: "PUBLIC", label: "Публичное" },
                    ]}
                  />
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="Расписание">
            <div className="grid gap-6">
              <div>
                <p className="text-sm text-zinc-400">Проведение</p>
                <div className="mt-3 grid gap-4 xl:grid-cols-2">
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
                </div>
              </div>

              {baseForm.status === "PUBLIC" ? (
                <div>
                  <p className="text-sm text-zinc-400">Регистрация</p>
                  <div className="mt-3 grid gap-4 xl:grid-cols-2">
                    <TextField
                      label="Начало регистрации"
                      type="datetime-local"
                      value={baseForm.dataStartRegistration}
                      onChange={(value) =>
                        updateBaseForm("dataStartRegistration", value)
                      }
                      required
                    />
                    <TextField
                      label="Конец регистрации"
                      type="datetime-local"
                      value={baseForm.dataEndRegistration}
                      onChange={(value) =>
                        updateBaseForm("dataEndRegistration", value)
                      }
                      required
                    />
                  </div>
                </div>
              ) : null}

              {features.hasLoadedSolution && !features.hasCases ? (
                <div className="max-w-xl">
                  <TextField
                    label="Дедлайн сдачи решения"
                    type="datetime-local"
                    value={baseForm.dateDeadLine}
                    onChange={(value) => updateBaseForm("dateDeadLine", value)}
                    required
                  />
                </div>
              ) : null}
            </div>
          </Panel>

          {baseForm.format !== "ONLINE" ? (
            <Panel title="Локация">
              <div className="grid gap-4">
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
                <div className="overflow-hidden rounded-[1.5rem] border border-zinc-800 xl:min-h-[32rem]">
                  <ArcGisPointMap
                    cordinatX={baseForm.cordinatX}
                    cordinatY={baseForm.cordinatY}
                    heightClassName="h-72 xl:h-[32rem]"
                  />
                </div>
              </div>
            </Panel>
          ) : (
            <Panel title="Локация">
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-4 text-sm leading-6 text-zinc-400">
                Для онлайн-мероприятия физический адрес и карта не требуются.
              </div>
            </Panel>
          )}

          <Panel title="Теги">
            <TagCombobox
              filteredTags={filteredTags}
              isOpen={isTagDropdownOpen}
              search={tagSearch}
              selectedTags={selectedTags}
              onAddFromSearch={addTagFromSearch}
              onClose={() => setIsTagDropdownOpen(false)}
              onInputFocus={() => setIsTagDropdownOpen(true)}
              onRemoveTag={removeTag}
              onSearchChange={(value) => {
                setTagSearch(value);
                setIsTagDropdownOpen(true);
              }}
              onSelectTag={(tag) => addTag({ id: tag.idTag, name: tag.name })}
            />
          </Panel>

          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep("type")}
              className="rounded-2xl border border-zinc-700 px-4 py-3 text-sm text-zinc-200"
            >
              Назад
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white"
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
                  hidden={!features.hasLoadedSolution}
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
                      {eventCase.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {eventCase.tags.map((tag) => (
                            <span
                              key={tag.id ?? tag.name}
                              className="max-w-full overflow-hidden rounded-md border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300"
                              title={tag.name}
                            >
                              <span className="block max-w-44 truncate">
                                {tag.name}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : null}
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

          {features.hasEntryPass && (
            <Panel title="QR-пропуск">
              <p className="text-sm text-zinc-300">
                Для мероприятия будет доступен одноразовый QR-пропуск на вход.
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
          availableTags={availableTags}
          form={caseModal}
          hasTeams={features?.hasTeams ?? false}
          onChange={setCaseModal}
          onClose={() => setCaseModal(null)}
          onSave={saveCase}
        />
      )}

      {customTypeModal && (
        <CustomEventTypeModal
          form={customTypeModal}
          onApply={applyCustomType}
          onChange={setCustomTypeModal}
          onClose={() => setCustomTypeModal(null)}
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
  onClose,
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
  onClose: () => void;
  onInputFocus: () => void;
  onRemoveTag: (tag: EventTagDraft) => void;
  onSearchChange: (value: string) => void;
  onSelectTag: (tag: EventTagOption) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={wrapperRef} className="grid gap-3">
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
              className="max-w-full overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-left text-sm text-zinc-100 hover:border-red-400 hover:text-red-200"
              title={tag.name}
            >
              <span className="block max-w-44 truncate">{tag.name}</span>
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

function SegmentedControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm text-zinc-300">{label}</p>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-2">
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={twMerge(
                "min-w-[8rem] flex-1 rounded-xl border px-4 py-2 text-center text-sm transition",
                isActive
                  ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-200"
                  : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
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
  hidden,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <label className="grid min-w-0 gap-2 text-sm text-zinc-300">
      {label}
      <input
        type={type}
        required={required}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
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
    <label className="grid min-w-0 gap-2 text-sm text-zinc-300">
      {label}
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary"
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
  rows = 4,
  resize = "vertical",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  resize?: "none" | "vertical";
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm text-zinc-300">
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className={twMerge(
          "w-full min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-primary",
          resize === "none" ? "resize-none" : "resize-y",
        )}
      />
    </label>
  );
}

function CustomEventTypeModal({
  form,
  onApply,
  onChange,
  onClose,
}: {
  form: CustomEventTypeModalForm;
  onApply: () => void;
  onChange: (form: CustomEventTypeModalForm) => void;
  onClose: () => void;
}) {
  const updateFeature = (
    field: keyof EventFeaturePreset,
    checked: boolean,
  ) => {
    onChange({
      ...form,
      features: {
        ...form.features,
        [field]: checked,
      },
    });
  };

  const enabledFeatures = customFeatureGroups
    .flatMap((group) => group.items)
    .filter((item) => form.features[item.key]);

  const enabledFeatureLabels = enabledFeatures.map((feature) => feature.label);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 sm:p-4">
      <div className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full min-w-0 max-w-none flex-col overflow-x-hidden overflow-y-hidden border-zinc-700 bg-zinc-950 text-white shadow-2xl sm:h-[calc(100dvh-2rem)] sm:max-w-5xl sm:rounded-[2rem] sm:border">
        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950 px-4 py-3 sm:px-5 sm:py-5 md:px-7">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Свой шаблон
            </p>
            <h2 className="mt-2 break-words text-xl font-semibold leading-tight text-zinc-50 sm:mt-3 sm:text-3xl">
              Другой тип мероприятия
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-5 text-zinc-400 sm:mt-3 sm:leading-6">
              Соберите собственную структуру мероприятия из нужных модулей.
              <span className="hidden xl:inline">
                {" "}На компьютере справа будет виден краткий итог выбранных
                возможностей.
              </span>
            </p>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden px-3 py-3 sm:px-5 sm:py-5 md:px-7">
            <div className="shrink-0 rounded-[1.25rem] border border-zinc-800 bg-zinc-900/60 p-3 sm:rounded-[1.5rem] sm:p-5">
              <TextField
                label="Вид мероприятия"
                value={form.typeName}
                onChange={(value) => onChange({ ...form, typeName: value })}
                required
              />
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1 sm:mt-6">
              <div className="grid gap-6">
                {customFeatureGroups.map((group) => (
                  <section
                    key={group.title}
                    className="min-w-0 rounded-[1.25rem] border border-zinc-800 bg-zinc-900/60 p-4 sm:rounded-[1.5rem] sm:p-5"
                  >
                    <div className="max-w-2xl">
                      <h3 className="text-base font-semibold text-zinc-50 sm:text-lg">
                        {group.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {group.description}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {group.items.map((item) => (
                        <FeatureCheckbox
                          key={item.key}
                          checked={form.features[item.key]}
                          label={item.label}
                          description={item.description}
                          onChange={(checked) => updateFeature(item.key, checked)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>

          <aside className="hidden min-h-0 flex-col border-l border-zinc-800 bg-zinc-900/50 xl:flex">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7">
              <div className="min-w-0 rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Предпросмотр структуры
                </p>
                <h3 className="mt-3 line-clamp-2 overflow-hidden break-all text-xl font-semibold leading-tight text-zinc-50">
                  {form.typeName.trim() || "Новый тип мероприятия"}
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  После применения этот тип станет основой для дальнейшего
                  заполнения формы создания мероприятия.
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                        Активных модулей
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-zinc-100">
                        {enabledFeatures.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                        Режим
                      </p>
                      <p className="mt-2 text-sm font-medium text-zinc-100">
                        {enabledFeatures.length > 0
                          ? "Настраиваемый"
                          : "Пустой шаблон"}
                      </p>
                    </div>
                  </div>

                  {enabledFeatureLabels.length > 0 ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-4">
                      <p className="text-sm font-medium text-zinc-100">
                        Будут включены
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {enabledFeatureLabels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-4 text-sm leading-6 text-zinc-400">
                      Пока не выбрано ни одной опции. Отметьте нужные модули
                      слева, чтобы собрать свой сценарий мероприятия.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="shrink-0 border-t border-zinc-800 bg-zinc-950/95 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-5 sm:py-4 md:px-7">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:text-white"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={onApply}
              className="min-w-0 flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-medium transition hover:bg-emerald-500"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCheckbox({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-3 text-sm text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 sm:px-4 sm:py-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-100">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-sm leading-5 text-zinc-400 sm:leading-6">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function CaseModal({
  availableTags,
  form,
  hasTeams,
  onChange,
  onClose,
  onSave,
}: {
  availableTags: EventTagOption[];
  form: CaseModalForm;
  hasTeams: boolean;
  onChange: (form: CaseModalForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const update = (field: keyof CaseModalForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  const filteredCaseTags = availableTags.filter((tag) => {
    const query = normalizeTagName(form.tagSearch);
    const alreadySelected = form.tags.some((selectedTag) => {
      if (selectedTag.id && selectedTag.id === tag.idTag) return true;
      return normalizeTagName(selectedTag.name) === normalizeTagName(tag.name);
    });

    if (alreadySelected) return false;
    if (!query) return true;

    return normalizeTagName(tag.name).includes(query);
  });

  const addCaseTag = (tag: EventTagDraft) => {
    const normalizedName = normalizeTagName(tag.name);
    const isSelected = form.tags.some((selectedTag) => {
      if (tag.id && selectedTag.id === tag.id) return true;
      return normalizeTagName(selectedTag.name) === normalizedName;
    });

    if (isSelected || !normalizedName) return;

    onChange({
      ...form,
      tagSearch: "",
      isTagDropdownOpen: false,
      tags: [...form.tags, tag],
    });
  };

  const addCaseTagFromSearch = () => {
    const name = form.tagSearch.trim();

    if (!name) return;

    const existingTag = availableTags.find(
      (tag) => normalizeTagName(tag.name) === normalizeTagName(name),
    );

    addCaseTag(
      existingTag
        ? { id: existingTag.idTag, name: existingTag.name }
        : { name },
    );
  };

  const removeCaseTag = (tag: EventTagDraft) => {
    onChange({
      ...form,
      tags: form.tags.filter((item) => {
        if (tag.id) return item.id !== tag.id;
        return normalizeTagName(item.name) !== normalizeTagName(tag.name);
      }),
    });
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
          <TagCombobox
            filteredTags={filteredCaseTags}
            isOpen={form.isTagDropdownOpen}
            search={form.tagSearch}
            selectedTags={form.tags}
            onAddFromSearch={addCaseTagFromSearch}
            onClose={() =>
              onChange({ ...form, isTagDropdownOpen: false })
            }
            onInputFocus={() =>
              onChange({ ...form, isTagDropdownOpen: true })
            }
            onRemoveTag={removeCaseTag}
            onSearchChange={(value) =>
              onChange({
                ...form,
                tagSearch: value,
                isTagDropdownOpen: true,
              })
            }
            onSelectTag={(tag) =>
              addCaseTag({ id: tag.idTag, name: tag.name })
            }
          />
          <div className="max-w-56">
            <TextField
              label={hasTeams ? "Количество команд" : "Количество участников"}
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
