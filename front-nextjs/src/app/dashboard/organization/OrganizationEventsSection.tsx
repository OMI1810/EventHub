'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { useOrganizationEvents } from '@/hooks/useOrganizationEvents'
import { IOrganizationEventSummary } from '@/types/organization.types'

function formatDateRange(start: string, end: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).format(new Date(start)) + ' - ' +
		new Intl.DateTimeFormat('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		}).format(new Date(end))
}

function getStatusLabel(status: IOrganizationEventSummary['status']) {
	switch (status) {
		case 'PRIVATE':
			return 'Приватное'
		case 'FINISHED':
			return 'Завершено'
		case 'OPEN':
			return 'Открыто'
		case 'OPEN_REGISTRATION':
			return 'Открыта регистрация'
		case 'CLOSED_REGISTRATION':
			return 'Регистрация закрыта'
		case 'PUBLISHED':
		default:
			return 'Опубликовано'
	}
}

function FeatureBadge({ active, label }: { active: boolean; label: string }) {
	if (!active) return null

	return (
		<span className="rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300">
			{label}
		</span>
	)
}

export function OrganizationEventsSection() {
	const { events, isLoading } = useOrganizationEvents()

	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
				Мероприятия организации
			</p>
			<h1 className="mt-3 text-3xl font-bold">Список мероприятий</h1>
			<p className="mt-4 max-w-3xl text-sm text-zinc-300">
				Здесь отображаются все мероприятия, созданные от имени этой
				организации. На этом этапе модуль работает как обзорный список.
			</p>

			{isLoading ? (
				<div className="mt-6">
					<MiniLoader width={80} height={80} />
				</div>
			) : events.length === 0 ? (
				<div className="mt-6 rounded-2xl border border-dashed border-zinc-800 px-5 py-6 text-sm text-zinc-500">
					У этой организации пока нет мероприятий.
				</div>
			) : (
				<div className="mt-6 grid gap-4 xl:grid-cols-2">
					{events.map(event => (
						<article
							key={event.idEvent}
							className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5"
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
										{getStatusLabel(event.status)}
									</p>
									<h2 className="mt-3 text-2xl font-bold text-zinc-100">
										{event.title}
									</h2>
								</div>

								<span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
									{event.format}
								</span>
							</div>

							<p className="mt-4 text-sm text-zinc-400">
								{event.description || 'Описание мероприятия пока не добавлено.'}
							</p>

							<div className="mt-4 flex flex-wrap gap-2">
								<span className="rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300">
									{event.type}
								</span>
								<FeatureBadge active={event.hasCases} label="Кейсы" />
								<FeatureBadge active={event.hasTeams} label="Команды" />
								<FeatureBadge active={event.hasMaterials} label="Материалы" />
								<FeatureBadge active={event.hasLoadedSolution} label="Решения" />
								<FeatureBadge active={event.hasResualt} label="Итоги" />
							</div>

							<div className="mt-5 grid gap-3 sm:grid-cols-3">
								<div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
									<p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
										Даты
									</p>
									<p className="mt-2 text-sm text-zinc-100">
										{formatDateRange(event.dataStart, event.dataEnd)}
									</p>
								</div>

								<div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
									<p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
										Участники
									</p>
									<p className="mt-2 text-sm text-zinc-100">
										{event.participantsCount}
									</p>
								</div>

								<div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
									<p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
										Команды
									</p>
									<p className="mt-2 text-sm text-zinc-100">
										{event.teamsCount}
									</p>
								</div>
							</div>
						</article>
					))}
				</div>
			)}
		</section>
	)
}
