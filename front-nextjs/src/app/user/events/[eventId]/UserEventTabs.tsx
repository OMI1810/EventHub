'use client'

import { EventAccessNotice } from '@/components/events/EventAccessNotice'
import { EventCaseCard } from '@/components/events/EventCaseCard'
import { EventMaterialsList } from '@/components/events/EventMaterialsList'
import { EventResultsList } from '@/components/events/EventResultsList'
import { EventTabsBase } from '@/components/events/EventTabsBase'
import userEventService from '@/services/user-event.service'
import { IUserEventDetails } from '@/types/user-event.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { UserEventPassTab } from './pass/UserEventPassTab'
import { UserTeamTab } from './team/UserTeamTab'

interface Props {
	event: IUserEventDetails
}

type TabKey =
	| 'cases'
	| 'team'
	| 'materials'
	| 'solution'
	| 'results'
	| 'pass'
	| 'status'

interface TabItem {
	key: TabKey
	label: string
}

type StatusStepState = 'done' | 'available' | 'locked'

interface StatusStep {
	key: string
	title: string
	state: StatusStepState
	detail: string
	targetTab?: Exclude<TabKey, 'status'>
	onClick?: () => void
}

function formatDateTime(date: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(date))
}

function getStepAccentClass(state: StatusStepState) {
	if (state === 'done') {
		return 'bg-emerald-500'
	}

	if (state === 'available') {
		return 'bg-zinc-500'
	}

	return 'border border-dashed border-zinc-600 bg-zinc-950'
}

function getStepBadgeClass(state: StatusStepState) {
	if (state === 'done') {
		return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
	}

	if (state === 'available') {
		return 'border-zinc-700 bg-zinc-900 text-zinc-300'
	}

	return 'border-zinc-800 bg-zinc-950 text-zinc-500'
}

function getStepLabel(state: StatusStepState) {
	if (state === 'done') {
		return 'Выполнено'
	}

	if (state === 'available') {
		return 'Доступно'
	}

	return 'Недоступно'
}

export function UserEventTabs({ event }: Props) {
	const queryClient = useQueryClient()
	const [solutionForm, setSolutionForm] = useState({
		urlSolution: '',
		urlPresentation: '',
		description: ''
	})
	const [solutionSavedState, setSolutionSavedState] = useState(false)

	const tabs = useMemo<TabItem[]>(() => {
		const nextTabs: TabItem[] = []

		if (event.hasCases) nextTabs.push({ key: 'cases', label: 'Кейсы' })
		if (event.hasTeams && event.isParticipating) nextTabs.push({ key: 'team', label: 'Команда' })
		if (event.hasMaterials && event.timeState.canViewEventMaterials) nextTabs.push({ key: 'materials', label: 'Материалы' })
		if (event.hasLoadedSolution && event.timeState.isEventStarted) {
			nextTabs.push({ key: 'solution', label: 'Загрузить решение' })
		}
		if (event.hasResualt && event.timeState.isEventFinished) nextTabs.push({ key: 'results', label: 'Итоги' })
		if (event.entryPass.enabled) nextTabs.push({ key: 'pass', label: 'Пропуск' })
		nextTabs.push({ key: 'status', label: 'Статус' })

		return nextTabs
	}, [
		event.hasCases,
		event.hasLoadedSolution,
		event.hasMaterials,
		event.hasResualt,
		event.hasTeams,
		event.entryPass.enabled,
		event.isParticipating,
		event.timeState.canViewEventMaterials,
		event.timeState.isEventFinished,
		event.timeState.isEventStarted
	])

	const [activeTab, setActiveTab] = useState<TabKey | null>(tabs[0]?.key ?? null)

	useEffect(() => {
		if (!tabs.some(tab => tab.key === activeTab)) {
			setActiveTab(tabs[0]?.key ?? null)
		}
	}, [activeTab, tabs])

	useEffect(() => {
		setSolutionForm({
			urlSolution: event.solution?.urlSolution ?? '',
			urlPresentation: event.solution?.urlPresentation ?? '',
			description: event.solution?.description ?? ''
		})
		setSolutionSavedState(false)
	}, [event.solution])

	const initialSolutionSnapshot = useMemo(
		() => ({
			urlSolution: event.solution?.urlSolution ?? '',
			urlPresentation: event.solution?.urlPresentation ?? '',
			description: event.solution?.description ?? ''
		}),
		[
			event.solution?.description,
			event.solution?.urlPresentation,
			event.solution?.urlSolution
		]
	)

	const hasUnsavedSolutionChanges =
		solutionForm.urlSolution !== initialSolutionSnapshot.urlSolution ||
		solutionForm.urlPresentation !== initialSolutionSnapshot.urlPresentation ||
		solutionForm.description !== initialSolutionSnapshot.description

	const participateMutation = useMutation({
		mutationFn: () => userEventService.participate(event.idEvent),
		onSuccess() {
			queryClient.invalidateQueries({ queryKey: ['user-events', 'feed'] })
			queryClient.invalidateQueries({ queryKey: ['user-events', 'my'] })
			queryClient.invalidateQueries({
				queryKey: ['user-events', 'details', event.idEvent]
			})
			toast.success('Вы зарегистрировались на мероприятие')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message =
				error.response?.data?.message ?? 'Не удалось зарегистрироваться на мероприятие'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const selectCaseMutation = useMutation({
		mutationFn: (caseId: string) => userEventService.selectCase(event.idEvent, caseId),
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ['user-events', 'details', event.idEvent]
			})
			queryClient.invalidateQueries({
				queryKey: ['user-team', event.idEvent]
			})
			toast.success('Кейс успешно выбран')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message = error.response?.data?.message ?? 'Не удалось выбрать кейс'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const saveSolutionMutation = useMutation({
		mutationFn: () =>
			userEventService.saveSolution(event.idEvent, {
				urlSolution: solutionForm.urlSolution.trim(),
				urlPresentation: solutionForm.urlPresentation.trim(),
				description: solutionForm.description.trim()
			}),
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ['user-events', 'details', event.idEvent]
			})
			setSolutionSavedState(true)
			toast.success('Решение сохранено')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message = error.response?.data?.message ?? 'Не удалось сохранить решение'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const solutionIsAvailable =
		event.isParticipating &&
		(!event.hasTeams ||
			(Boolean(event.teamContext?.hasTeam) && Boolean(event.teamContext?.isCaptain))) &&
		(!event.hasCases || Boolean(event.selectedCase)) &&
		event.timeState.canUploadSolution
	const caseSelectionIsOpen = event.cases.some(
		eventCase => eventCase.timeState.isCaseSelectionOpen
	)

	const statusSteps = useMemo<StatusStep[]>(() => {
		const steps: StatusStep[] = []

		steps.push({
			key: 'participation',
			title: 'Регистрация / участие',
			state: event.isParticipating
				? 'done'
				: event.canParticipate
					? 'available'
					: 'locked',
			detail: event.isParticipating
				? 'Вы участвуете'
				: event.canParticipate
					? 'Можно зарегистрироваться на мероприятие'
					: 'Регистрация сейчас недоступна',
			onClick:
				!event.isParticipating && event.canParticipate && !participateMutation.isPending
					? () => participateMutation.mutate()
					: undefined
		})

		if (event.hasTeams) {
			steps.push({
				key: 'team',
				title: 'Команда',
				state: event.teamContext?.hasTeam
					? 'done'
					: event.isParticipating
						? 'available'
						: 'locked',
				detail: event.teamContext?.hasTeam
					? event.teamContext.isCaptain
						? 'Капитан'
						: 'Участник'
					: event.isParticipating
						? 'Нужно создать команду или вступить в существующую'
						: 'Станет доступно после участия в мероприятии',
				targetTab: 'team'
			})
		}

		if (event.hasCases) {
			const caseSelectionAvailable =
				event.isParticipating &&
				(!event.hasTeams || Boolean(event.teamContext?.hasTeam)) &&
				caseSelectionIsOpen
			const caseStepDetail = event.selectedCase
				? event.selectedCase.title
				: caseSelectionAvailable
					? 'Кейс ещё не выбран'
					: !caseSelectionIsOpen
						? 'Сейчас кейсы нельзя выбрать'
						: event.hasTeams
							? 'Нужна команда, чтобы выбрать кейс'
							: 'Станет доступно после участия в мероприятии'

			steps.push({
				key: 'case',
				title: 'Выбор кейса',
				state: event.selectedCase
					? 'done'
					: caseSelectionAvailable
						? 'available'
						: 'locked',
				detail: caseStepDetail,
				targetTab: 'cases'
			})
		}

		if (event.hasLoadedSolution) {
			steps.push({
				key: 'solution',
				title: 'Загрузка решения',
				state: event.solution
					? 'done'
					: solutionIsAvailable
						? 'available'
						: 'locked',
				detail: event.solution?.updatedAt
					? `Обновлено ${formatDateTime(event.solution.updatedAt)}`
					: solutionIsAvailable
						? 'Решение ещё не сохранено'
						: 'Сначала выполните предыдущие шаги',
				targetTab: 'solution'
			})
		}

		if (event.hasResualt) {
			const userPlace = event.results[0]?.place ?? null

			steps.push({
				key: 'results',
				title: 'Итоги',
				state: event.results.length
					? 'done'
					: event.isParticipating
						? 'available'
						: 'locked',
				detail: event.results.length
					? userPlace
						? `${userPlace} место`
						: 'Итоги опубликованы'
					: event.isParticipating
						? 'Итоги ещё не опубликованы'
						: 'Станет доступно после участия в мероприятии',
				targetTab: 'results'
			})
		}

		return steps
	}, [
		event.canParticipate,
		event.hasCases,
		event.hasLoadedSolution,
		event.hasResualt,
		event.hasTeams,
		event.isParticipating,
		event.cases,
		event.results,
		event.selectedCase,
		event.solution,
		event.teamContext,
		caseSelectionIsOpen,
		participateMutation.isPending,
		solutionIsAvailable
	])

	const completedStepsCount = statusSteps.filter(step => step.state === 'done').length

	if (!tabs.length || !activeTab) {
		return null
	}

	const handleSelectCase = (caseId: string) => {
		const eventCase = event.cases.find(eventCase => eventCase.idCase === caseId)

		if (!event.isParticipating) {
			toast.error('Чтобы выбрать кейс, необходимо участвовать в мероприятии')
			return
		}

		if (event.selectedCaseId) {
			toast.error('Для этого участия кейс уже выбран')
			return
		}

		if (event.hasTeams && !event.teamContext?.hasTeam) {
			toast.error('Сначала необходимо создать команду или вступить в неё')
			return
		}

		if (event.hasTeams && event.teamContext?.hasTeam && !event.teamContext.isCaptain) {
			toast.error('Выбирать кейс для команды может только капитан')
			return
		}

		if (!eventCase?.timeState.isCaseSelectionOpen) {
			toast.error('Сейчас кейс нельзя выбрать')
			return
		}

		selectCaseMutation.mutate(caseId)
	}

	const handleSolutionFieldChange = (
		field: 'urlSolution' | 'urlPresentation' | 'description',
		value: string
	) => {
		setSolutionSavedState(false)
		setSolutionForm(current => ({
			...current,
			[field]: value
		}))
	}

	const handleSaveSolution = () => {
		if (!solutionForm.urlSolution.trim() || !solutionForm.urlPresentation.trim()) {
			toast.error('Укажи ссылку на решение и ссылку на презентацию')
			return
		}

		saveSolutionMutation.mutate()
	}

	const renderContent = () => {
		switch (activeTab) {
			case 'cases':
				return (
					<div className="grid gap-4 xl:grid-cols-2">
						{event.cases.length ? (
							event.cases.map(eventCase => {
								const isSelected = event.selectedCaseId === eventCase.idCase

								return (
									<EventCaseCard
										key={eventCase.idCase}
										holder={eventCase.holder}
										title={eventCase.title}
										description={eventCase.description}
										teamLimit={eventCase.teamLimit}
										occupiedPlaces={eventCase.occupiedPlaces}
										dateForStartSelected={eventCase.dateForStartSelected}
										dateForEndSelected={eventCase.dateForEndSelected}
										actionLabel={
											isSelected
												? 'Кейс выбран'
												: selectCaseMutation.isPending
													? 'Выбор...'
													: 'Выбрать кейс'
										}
										onAction={() => handleSelectCase(eventCase.idCase)}
										disabled={
											selectCaseMutation.isPending ||
											Boolean(event.selectedCaseId) ||
											!eventCase.timeState.isCaseSelectionOpen
										}
									/>
								)
							})
						) : (
							<EventAccessNotice text="Список кейсов пока пуст." />
						)}
					</div>
				)

			case 'team':
				return <UserTeamTab eventId={event.idEvent} />

			case 'materials': {
				if (!event.isParticipating) {
					return (
						<EventAccessNotice text="Материалы доступны только участникам мероприятия." />
					)
				}

				if (event.hasCases && !event.selectedCase) {
					return (
						<EventAccessNotice text="Чтобы открыть материалы, необходимо сначала выбрать кейс." />
					)
				}

				if (event.selectedCase && !event.selectedCase.isOpen) {
					return (
						<EventAccessNotice text="Материалы выбранного кейса пока недоступны: кейс ещё не открыт администратором." />
					)
				}

				const materials = event.hasCases ? event.selectedCaseMaterials : event.materials

				return materials.length ? (
					<EventMaterialsList
						materials={materials}
						selectedCase={
							event.selectedCase
								? {
										title: event.selectedCase.title,
										holder: event.selectedCase.holder
									}
								: null
						}
					/>
				) : (
					<EventAccessNotice text="Материалы для текущего сценария пока не добавлены." />
				)
			}

			case 'solution': {
				if (!event.isParticipating) {
					return (
						<EventAccessNotice text="Загрузка решения доступна только участникам мероприятия." />
					)
				}

				if (event.hasTeams && !event.teamContext?.hasTeam) {
					return (
						<EventAccessNotice text="Чтобы загрузить решение, сначала необходимо создать команду или вступить в неё." />
					)
				}

				if (event.hasTeams && event.teamContext?.hasTeam && !event.teamContext.isCaptain) {
					return (
						<EventAccessNotice text="Загружать решение для команды может только капитан." />
					)
				}

				if (event.hasCases && !event.selectedCase) {
					return (
						<EventAccessNotice text="Чтобы загрузить решение, сначала необходимо выбрать кейс." />
					)
				}

				if (!event.timeState.isEventStarted) {
					return (
						<EventAccessNotice text="Загрузить решение можно только когда мероприятие открыто." />
					)
				}

				if (event.timeState.isSolutionDeadlinePassed) {
					return <EventAccessNotice text="Время для загрузки решения завершилось" />
				}

				if (!event.timeState.canUploadSolution) {
					return <EventAccessNotice text="Загрузка решения сейчас недоступна." />
				}

				const solutionStatusText = saveSolutionMutation.isPending
					? 'Сохранение решения...'
					: hasUnsavedSolutionChanges
						? 'Есть несохранённые изменения'
						: event.solution || solutionSavedState
							? 'Решение сохранено'
							: 'Решение пока не сохранено'

				const solutionStatusClass = saveSolutionMutation.isPending
					? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
					: hasUnsavedSolutionChanges
						? 'border-zinc-700 bg-zinc-950/70 text-zinc-300'
						: event.solution || solutionSavedState
							? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
							: 'border-zinc-800 bg-zinc-950/70 text-zinc-400'

				const solutionButtonLabel = saveSolutionMutation.isPending
					? 'Сохранение...'
					: hasUnsavedSolutionChanges || !event.solution
						? 'Сохранить'
						: 'Сохранено'

				return (
					<div className="grid gap-4">
						<div className={`rounded-2xl border px-5 py-4 ${solutionStatusClass}`}>
							<p className="text-sm font-medium">{solutionStatusText}</p>
							{event.solution?.updatedAt ? (
								<p className="mt-2 text-xs text-zinc-400">
									Последнее обновление: {formatDateTime(event.solution.updatedAt)}
								</p>
							) : null}
						</div>

						{event.selectedCase ? (
							<div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4">
								<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
									Выбранный кейс
								</p>
								<h3 className="mt-3 text-lg font-semibold text-zinc-100">
									{event.selectedCase.title}
								</h3>
							</div>
						) : null}

						{event.timeState.solutionDeadline ? (
							<div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4">
								<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
									Дедлайн сдачи
								</p>
								<p className="mt-3 text-sm text-zinc-300">
									{formatDateTime(event.timeState.solutionDeadline)}
								</p>
							</div>
						) : null}

						<div className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
							<label className="grid gap-2">
								<span className="text-sm font-medium text-zinc-200">
									Ссылка на решение
								</span>
								<input
									type="url"
									value={solutionForm.urlSolution}
									onChange={currentEvent =>
										handleSolutionFieldChange('urlSolution', currentEvent.target.value)
									}
									placeholder="https://..."
									className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-emerald-500"
								/>
							</label>

							<label className="grid gap-2">
								<span className="text-sm font-medium text-zinc-200">
									Ссылка на презентацию
								</span>
								<input
									type="url"
									value={solutionForm.urlPresentation}
									onChange={currentEvent =>
										handleSolutionFieldChange(
											'urlPresentation',
											currentEvent.target.value
										)
									}
									placeholder="https://..."
									className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-emerald-500"
								/>
							</label>

							<label className="grid gap-2">
								<span className="text-sm font-medium text-zinc-200">
									Описание решения
								</span>
								<textarea
									value={solutionForm.description}
									onChange={currentEvent =>
										handleSolutionFieldChange('description', currentEvent.target.value)
									}
									placeholder="Коротко опиши решение, ключевые идеи и важные замечания."
									rows={5}
									className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-emerald-500"
								/>
							</label>

							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-sm text-zinc-500">
									{hasUnsavedSolutionChanges
										? 'Есть несохранённые изменения. Не забудь обновить решение.'
										: event.solution
											? 'Можно обновлять сохранённое решение до окончания дедлайна.'
											: 'После сохранения решение можно будет обновить.'}
								</p>
								<button
									type="button"
									onClick={handleSaveSolution}
									disabled={
										saveSolutionMutation.isPending ||
										(!hasUnsavedSolutionChanges && Boolean(event.solution))
									}
									className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{solutionButtonLabel}
								</button>
							</div>
						</div>
					</div>
				)
			}

			case 'results':
				if (!event.isParticipating) {
					return <EventAccessNotice text="Итоги доступны только участникам мероприятия." />
				}

				return event.results.length ? (
					<EventResultsList results={event.results} />
				) : (
					<EventAccessNotice text="Администратор ещё не выставил итоги мероприятия." />
				)

			case 'pass':
				return <UserEventPassTab event={event} />

			case 'status':
				return (
					<div className="grid gap-4">
						<div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4">
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Прогресс
							</p>
							<p className="mt-3 text-sm text-zinc-300">
								Выполнено: {completedStepsCount} из {statusSteps.length} шагов
							</p>
						</div>

						<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
							<div className="flex gap-4">
								<div className="relative flex w-8 shrink-0 justify-center">
									<div className="absolute bottom-3 top-3 left-1/2 w-px -translate-x-1/2 bg-zinc-800" />
									<div className="relative z-10 flex w-full flex-col gap-3">
										{statusSteps.map(step => (
											<div
												key={`${step.key}-indicator`}
												className="flex min-h-[92px] items-center justify-center"
											>
												<div
													className={`h-4 w-4 rounded-full ${getStepAccentClass(step.state)}`}
												/>
											</div>
										))}
									</div>
								</div>

								<div className="grid flex-1 gap-3">
									{statusSteps.map(step => (
										<button
											key={step.key}
											type="button"
											onClick={() => {
												if (step.onClick) {
													step.onClick()
													return
												}

												if (step.targetTab) {
													setActiveTab(step.targetTab)
												}
											}}
											disabled={
												step.state === 'locked' ||
												(step.key === 'participation' && participateMutation.isPending)
											}
											className="group flex min-h-[92px] w-full items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-5 py-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-80"
										>
											<div className="min-w-0">
												<p className="text-sm font-semibold text-zinc-100">{step.title}</p>
												<p className="mt-2 text-sm text-zinc-400">{step.detail}</p>
											</div>
											<span
												className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getStepBadgeClass(step.state)}`}
											>
												{getStepLabel(step.state)}
											</span>
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				)

			default:
				return null
		}
	}

	return (
		<EventTabsBase tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
			{renderContent()}
		</EventTabsBase>
	)
}
