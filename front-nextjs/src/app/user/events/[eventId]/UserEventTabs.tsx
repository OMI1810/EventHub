'use client'

import { IUserEventDetails } from '@/types/user-event.types'
import { useMemo, useState } from 'react'
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

export function UserEventTabs({ event }: Props) {
	const tabs = useMemo<TabItem[]>(() => {
		const nextTabs: TabItem[] = []

		if (event.hasCases) nextTabs.push({ key: 'cases', label: 'Кейсы' })
		if (event.hasTeams) nextTabs.push({ key: 'team', label: 'Команда' })
		if (event.hasMaterials) nextTabs.push({ key: 'materials', label: 'Материалы' })
		if (event.hasLoadedSolution)
			nextTabs.push({ key: 'solution', label: 'Загрузить решение' })
		if (event.hasResualt) nextTabs.push({ key: 'results', label: 'Итоги' })

		return nextTabs
	}, [
		event.hasCases,
		event.hasLoadedSolution,
		event.hasMaterials,
		event.hasResualt,
		event.hasTeams
	])

	const [activeTab, setActiveTab] = useState<TabKey | null>(tabs[0]?.key ?? null)

	if (!tabs.length || !activeTab) {
		return null
	}

	const renderContent = () => {
		switch (activeTab) {
			case 'cases':
				return (
					<div className="grid gap-4 xl:grid-cols-2">
						{event.cases.length ? (
							event.cases.map(eventCase => (
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
											onClick={() => {
												if (!event.isParticipating) {
													toast.error(
														'Чтобы выбрать кейс, необходимо участвовать в мероприятии'
													)
													return
												}

												toast.error('Выбор кейса пока недоступен')
											}}
											className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
										>
											Выбрать кейс
										</button>
									</div>
								</article>
							))
						) : (
							<AccessWarning text="Список кейсов пока пуст." />
						)}
					</div>
				)

			case 'team':
				return <UserTeamTab eventId={event.idEvent} />

			case 'materials':
				if (!event.isParticipating) {
					return (
						<AccessWarning text="Материалы доступны только участникам мероприятия." />
					)
				}

				if (event.hasCases) {
					return (
						<AccessWarning text="Чтобы открыть материалы, необходимо сначала выбрать кейс." />
					)
				}

				return event.materials.length ? (
					<div className="grid gap-4">
						{event.materials.map(material => (
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
					<AccessWarning text="Материалы для этого мероприятия не добавлены." />
				)

			case 'solution':
				if (!event.isParticipating) {
					return (
						<AccessWarning text="Загрузка решения доступна только участникам мероприятия." />
					)
				}

				if (event.status !== 'OPEN') {
					return (
						<AccessWarning text="Загрузить решение можно только когда мероприятие открыто." />
					)
				}

				return (
					<AccessWarning text="Форма загрузки решения будет доступна в этой вкладке." />
				)

			case 'results':
				if (!event.isParticipating) {
					return (
						<AccessWarning text="Итоги доступны только участникам мероприятия." />
					)
				}

				return event.results.length ? (
					<div className="grid gap-4">
						{event.results.map(result => (
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
						))}
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
