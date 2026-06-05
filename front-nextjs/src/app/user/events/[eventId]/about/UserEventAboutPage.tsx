'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { USER_PAGES } from '@/config/pages/user.config'
import userEventService from '@/services/user-event.service'
import { IUserEventAdminContact } from '@/types/user-event.types'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'

const ArcGisPointMap = dynamic(
	() =>
		import('@/components/map/ArcGisPointMap').then(
			module => module.ArcGisPointMap
		),
	{
		ssr: false,
		loading: () => (
			<div className="h-[460px] rounded-md border border-zinc-700 bg-zinc-950" />
		)
	}
)

interface Props {
	eventId: string
}

function formatDateRange(start: string, end: string) {
	const formatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Europe/Moscow'
	})

	return `${formatter.format(new Date(start))} - ${formatter.format(
		new Date(end)
	)}`
}

function formatAdminName(admin: IUserEventAdminContact) {
	const name = [admin.surname, admin.name, admin.patronymic]
		.filter(Boolean)
		.join(' ')

	return name || admin.email
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
	return (
		<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
			<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
				{label}
			</p>
			<p className="mt-3 break-words text-sm text-zinc-200">
				{value || 'Не указано'}
			</p>
		</div>
	)
}

function AdminContactModal({
	admin,
	onClose
}: {
	admin: IUserEventAdminContact
	onClose: () => void
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
			<div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
				<div className="flex min-w-0 items-start justify-between gap-4 border-b border-zinc-800 p-5">
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Администратор
						</p>
						<h2 className="mt-2 line-clamp-2 break-all text-xl font-bold text-white">
							{formatAdminName(admin)}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="shrink-0 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-900"
					>
						Закрыть
					</button>
				</div>

				<div className="grid gap-3 p-5">
					<InfoRow label="Email" value={admin.email} />
					<InfoRow label="Телефон" value={admin.phone} />
					<InfoRow label="Дополнительный контакт" value={admin.contact} />
				</div>
			</div>
		</div>
	)
}

function EventAdminsPanel({
	admins,
	onSelect
}: {
	admins: IUserEventAdminContact[]
	onSelect: (admin: IUserEventAdminContact) => void
}) {
	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<div className="flex items-center justify-between gap-4">
				<h2 className="text-2xl font-bold">Администраторы мероприятия</h2>
				<span className="shrink-0 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
					{admins.length}
				</span>
			</div>

			{admins.length ? (
				<div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-2">
					{admins.map(admin => (
						<button
							key={admin.idUser}
							type="button"
							onClick={() => onSelect(admin)}
							className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-left transition-colors hover:border-emerald-500/60 hover:bg-zinc-950"
						>
							<p className="line-clamp-2 break-all text-sm font-semibold text-zinc-100">
								{formatAdminName(admin)}
							</p>
							<p className="mt-2 truncate text-xs text-zinc-500">
								{admin.email}
							</p>
						</button>
					))}
				</div>
			) : (
				<p className="mt-5 text-sm text-zinc-500">
					Администраторы мероприятия не указаны.
				</p>
			)}
		</section>
	)
}

export function UserEventAboutPage({ eventId }: Props) {
	const [selectedAdmin, setSelectedAdmin] =
		useState<IUserEventAdminContact | null>(null)
	const { data, isLoading } = useQuery({
		queryKey: ['user-events', 'details', eventId],
		queryFn: () => userEventService.getEventDetails(eventId),
		refetchInterval: 30_000,
		refetchOnWindowFocus: true
	})

	if (isLoading) {
		return (
			<div className="flex min-h-[320px] items-center justify-center">
				<MiniLoader width={120} height={120} />
			</div>
		)
	}

	const event = data?.data

	if (!event) {
		return (
			<div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-xl">
				<h1 className="text-3xl font-bold">Мероприятие недоступно</h1>
				<p className="mt-4 text-sm text-zinc-400">
					Не удалось загрузить подробную информацию о мероприятии.
				</p>
			</div>
		)
	}

	const eventHref = USER_PAGES.event(event.slug || event.idEvent)
	const isOnline = event.format === 'ONLINE'
	const eventAddress = isOnline ? null : event.address
	const hasMap = !isOnline && event.cordinatX != null && event.cordinatY != null

	return (
		<div className="grid gap-6 text-white">
			<Link
				href={eventHref}
				className="inline-flex w-fit text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-200 hover:underline"
			>
				Назад к мероприятию
			</Link>

			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
				<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
					О мероприятии
				</p>
				<h1 className="mt-3 max-w-5xl whitespace-normal break-all text-3xl font-bold leading-tight">
					{event.title}
				</h1>
				<p className="mt-5 max-w-6xl whitespace-pre-wrap break-all text-sm leading-7 text-zinc-300">
					{event.description || 'Описание мероприятия отсутствует.'}
				</p>
			</section>

			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
				<h2 className="text-2xl font-bold">Контакты и место проведения</h2>
				<div className="mt-5 grid gap-4 md:grid-cols-2">
					<InfoRow label="Организация" value={event.organization.name} />
					<InfoRow
						label="Период проведения"
						value={formatDateRange(event.dataStart, event.dataEnd)}
					/>
					<InfoRow label="Email" value={event.organization.email} />
					<InfoRow label="Контакт" value={event.organization.contact} />
					<InfoRow label="Формат" value={event.format} />
					<InfoRow label="Адрес" value={eventAddress || 'Не указана'} />
				</div>
			</section>

			<EventAdminsPanel
				admins={event.admins ?? []}
				onSelect={setSelectedAdmin}
			/>

			{hasMap ? (
				<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
					<div className="[&>div>div]:h-[460px]">
						<ArcGisPointMap
							cordinatX={event.cordinatX ?? null}
							cordinatY={event.cordinatY ?? null}
						/>
					</div>
				</section>
			) : null}

			{selectedAdmin ? (
				<AdminContactModal
					admin={selectedAdmin}
					onClose={() => setSelectedAdmin(null)}
				/>
			) : null}
		</div>
	)
}
