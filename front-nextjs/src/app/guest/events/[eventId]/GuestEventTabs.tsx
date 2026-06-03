'use client'

import { EventAccessNotice } from '@/components/events/EventAccessNotice'
import { EventCaseCard } from '@/components/events/EventCaseCard'
import { EventTabsBase } from '@/components/events/EventTabsBase'
import { IPublicEventDetails } from '@/types/public-event.types'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
	event: IPublicEventDetails
}

type TabKey =
	| 'cases'
	| 'team'
	| 'materials'
	| 'solution'
	| 'results'
	| 'status'

interface TabItem {
	key: TabKey
	label: string
}

export function GuestEventTabs({ event }: Props) {
	const tabs = useMemo<TabItem[]>(() => {
		const nextTabs: TabItem[] = []

		if (event.hasCases) nextTabs.push({ key: 'cases', label: 'Кейсы' })
		if (event.hasTeams) nextTabs.push({ key: 'team', label: 'Команда' })
		if (event.hasMaterials) nextTabs.push({ key: 'materials', label: 'Материалы' })
		if (event.hasLoadedSolution) {
			nextTabs.push({ key: 'solution', label: 'Загрузить решение' })
		}
		if (event.hasResualt) nextTabs.push({ key: 'results', label: 'Итоги' })
		nextTabs.push({ key: 'status', label: 'Статус' })

		return nextTabs
	}, [
		event.hasCases,
		event.hasLoadedSolution,
		event.hasMaterials,
		event.hasResualt,
		event.hasTeams
	])

	const [activeTab, setActiveTab] = useState<TabKey | null>(tabs[0]?.key ?? null)

	useEffect(() => {
		if (!tabs.some(tab => tab.key === activeTab)) {
			setActiveTab(tabs[0]?.key ?? null)
		}
	}, [activeTab, tabs])

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
								<EventCaseCard
									key={eventCase.idCase}
									holder={eventCase.holder}
									title={eventCase.title}
									description={eventCase.description}
									teamLimit={eventCase.teamLimit}
									occupiedPlaces={eventCase.occupiedPlaces}
									dateForStartSelected={eventCase.dateForStartSelected}
									dateForEndSelected={eventCase.dateForEndSelected}
									actionLabel="Выбрать кейс"
									onAction={() =>
										toast.error(
											'Чтобы выбрать кейс, необходимо войти и принять участие в мероприятии'
										)
									}
								/>
							))
						) : (
							<EventAccessNotice text="Список кейсов пока пуст." showAuthCta={false} />
						)}
					</div>
				)

			case 'team':
				return (
					<EventAccessNotice
						text="Командный режим доступен после входа в аккаунт и регистрации на мероприятие."
						showAuthCta
					/>
				)

			case 'materials':
				return (
					<EventAccessNotice
						text="Материалы доступны только участникам мероприятия после входа в аккаунт."
						showAuthCta
					/>
				)

			case 'solution':
				return (
					<EventAccessNotice
						text="Загрузка решения доступна только участникам мероприятия после входа в аккаунт."
						showAuthCta
					/>
				)

			case 'results':
				return (
					<EventAccessNotice
						text="Итоги мероприятия доступны после входа в аккаунт и участия в событии."
						showAuthCta
					/>
				)

			case 'status':
				return (
					<EventAccessNotice
						text="Статус прохождения мероприятия становится доступен после входа в аккаунт и участия в событии."
						showAuthCta
					/>
				)
		}
	}

	return (
		<EventTabsBase tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
			{renderContent()}
		</EventTabsBase>
	)
}
