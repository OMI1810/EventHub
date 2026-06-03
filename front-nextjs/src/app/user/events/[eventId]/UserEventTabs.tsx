'use client'

import userEventService from '@/services/user-event.service'
import { IUserEventDetails } from '@/types/user-event.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { UserTeamTab } from './team/UserTeamTab'

interface Props {
	event: IUserEventDetails
}

type TabKey = 'cases' | 'team' | 'materials' | 'solution' | 'results'

interface TabItem {
	key: TabKey
	label: string
}

function AccessWarning({ text }: { text: string }) {
	return (
		<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-5 py-8 text-sm leading-6 text-zinc-400">
			{text}
		</div>
	)
}

function formatCaseSchedule(start: string, end: string) {
	const formatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	})

	return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`
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

		return nextTabs
	}, [
		event.hasCases,
		event.hasLoadedSolution,
		event.hasMaterials,
		event.hasResualt,
		event.hasTeams,
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
			const message =
				error.response?.data?.message ?? 'Не удалось сохранить решение'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

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
									<article
										key={eventCase.idCase}
										className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5"
									>
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div>
												<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
													{eventCase.holder || 'Кейсодержатель не указан'}
												</p>
												<h3 className="mt-3 text-xl font-bold">{eventCase.title}</h3>
											</div>

											{eventCase.teamLimit ? (
												<span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
													{eventCase.occupiedPlaces}/{eventCase.teamLimit}
												</span>
											) : null}
										</div>

										<p className="mt-4 text-sm leading-6 text-zinc-400">
											{eventCase.description || 'Описание кейса отсутствует.'}
										</p>

										<p className="mt-4 text-xs text-zinc-500">
											{formatCaseSchedule(
												eventCase.dateForStartSelected,
												eventCase.dateForEndSelected
											)}
										</p>

										<div className="mt-5 flex flex-wrap gap-3">
											<button
												type="button"
												onClick={() => handleSelectCase(eventCase.idCase)}
												disabled={
													selectCaseMutation.isPending ||
													Boolean(event.selectedCaseId) ||
													!eventCase.timeState.isCaseSelectionOpen
												}
												className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
											>
												{isSelected
													? 'Кейс выбран'
													: selectCaseMutation.isPending
														? 'Выбор...'
														: 'Выбрать кейс'}
											</button>
										</div>
									</article>
								)
							})
						) : (
							<AccessWarning text="Список кейсов пока пуст." />
						)}
					</div>
				)

			case 'team':
				return <UserTeamTab eventId={event.idEvent} />

			case 'materials': {
				if (!event.isParticipating) {
					return (
						<AccessWarning text="Материалы доступны только участникам мероприятия." />
					)
				}

				if (event.hasCases && !event.selectedCase) {
					return (
						<AccessWarning text="Чтобы открыть материалы, необходимо сначала выбрать кейс." />
					)
				}

				const materials = event.hasCases ? event.selectedCaseMaterials : event.materials

				return materials.length ? (
					<div className="grid gap-4">
						{event.selectedCase ? (
							<div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4">
								<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
									Выбранный кейс
								</p>
								<h3 className="mt-3 text-lg font-semibold text-zinc-100">
									{event.selectedCase.title}
								</h3>
								<p className="mt-2 text-sm text-zinc-400">
									{event.selectedCase.holder || 'Кейсодержатель не указан'}
								</p>
							</div>
						) : null}

						{materials.map(material => (
							<a
								key={material.idMaterial}
								href={material.url}
								target="_blank"
								rel="noreferrer"
								className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4 transition-colors hover:border-emerald-500/40 hover:bg-zinc-950"
							>
								<p className="text-sm font-semibold text-zinc-100">
									{material.title}
								</p>
								<p className="mt-2 text-sm text-zinc-400">
									{material.description || material.url}
								</p>
							</a>
						))}
					</div>
				) : (
					<AccessWarning text="Материалы для текущего сценария пока не добавлены." />
				)
			}

			case 'solution': {
				if (!event.isParticipating) {
					return (
						<AccessWarning text="Загрузка решения доступна только участникам мероприятия." />
					)
				}

				if (event.hasTeams && !event.teamContext?.hasTeam) {
					return (
						<AccessWarning text="Чтобы загрузить решение, сначала необходимо создать команду или вступить в неё." />
					)
				}

				if (event.hasTeams && event.teamContext?.hasTeam && !event.teamContext.isCaptain) {
					return (
						<AccessWarning text="Загружать решение для команды может только капитан." />
					)
				}

				if (event.hasCases && !event.selectedCase) {
					return (
						<AccessWarning text="Чтобы загрузить решение, сначала необходимо выбрать кейс." />
					)
				}

				if (!event.timeState.isEventStarted) {
					return (
						<AccessWarning text="Загрузить решение можно только после начала мероприятия." />
					)
				}

				if (event.timeState.isSolutionDeadlinePassed) {
					return <AccessWarning text="Время для загрузки решения завершилось" />
				}

				if (!event.timeState.canUploadSolution) {
					return <AccessWarning text="Загрузка решения сейчас недоступна." />
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
						<div
							className={`rounded-2xl border px-5 py-4 ${solutionStatusClass}`}
						>
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
									onChange={event =>
										handleSolutionFieldChange('urlSolution', event.target.value)
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
									onChange={event =>
										handleSolutionFieldChange(
											'urlPresentation',
											event.target.value
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
									onChange={event =>
										handleSolutionFieldChange('description', event.target.value)
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
					return <AccessWarning text="Итоги доступны только участникам мероприятия." />
				}

				const renderResultCard = (result: (typeof event.results)[number]) => (
					<div
						key={result.idResult}
						className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4"
					>
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
									Место {result.place}
								</p>
								<h3 className="mt-2 text-lg font-semibold">{result.title}</h3>
							</div>
							{result.score !== null && result.score !== undefined ? (
								<span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
									{result.score} баллов
								</span>
							) : null}
						</div>

						<p className="mt-3 text-sm text-zinc-400">
							{result.teamName || result.userName || 'Участник не указан'}
						</p>

						{result.description ? (
							<p className="mt-3 text-sm leading-6 text-zinc-400">
								{result.description}
							</p>
						) : null}
					</div>
				)

				if (event.hasCases && event.results.length) {
					const resultsByCase = event.cases
						.map(eventCase => ({
							eventCase,
							results: event.results.filter(result => result.caseId === eventCase.idCase)
						}))
						.filter(group => group.results.length)

					return resultsByCase.length ? (
						<div className="grid gap-5">
							{resultsByCase.map(({ eventCase, results }) => (
								<section
									key={eventCase.idCase}
									className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5"
								>
									<div>
										<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
											Кейс
										</p>
										<h3 className="mt-2 text-xl font-semibold text-zinc-100">
											{eventCase.title}
										</h3>
									</div>

									<div className="grid gap-4">
										{results.map(renderResultCard)}
									</div>
								</section>
							))}
						</div>
					) : (
						<AccessWarning text="Администратор ещё не выставил итоги мероприятия." />
					)
				}

				return event.results.length ? (
					<div className="grid gap-4">
						{event.results.map(renderResultCard)}
					</div>
				) : (
					<AccessWarning text="Администратор ещё не выставил итоги мероприятия." />
				)

			default:
				return null
		}
	}

	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
			<div className="flex flex-wrap gap-2">
				{tabs.map(tab => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={
							activeTab === tab.key
								? 'rounded-xl border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300'
								: 'rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800'
						}
					>
						{tab.label}
					</button>
				))}
			</div>

			<div className="mt-6">{renderContent()}</div>
		</section>
	)
}
