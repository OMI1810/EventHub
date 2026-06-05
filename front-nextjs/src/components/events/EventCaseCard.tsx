'use client'

import { EventTagOption } from '@/types/event-create.types'
import { formatShortDateTimeRange } from '@/utils/date-format'
import { useEffect, useRef, useState } from 'react'

interface Props {
	holder?: string | null
	title: string
	description?: string | null
	tags?: EventTagOption[]
	teamLimit?: number | null
	occupiedPlaces?: number | null
	dateForStartSelected: string
	dateForEndSelected: string
	actionLabel: string
	onAction: () => void
	disabled?: boolean
}

function CaseDescriptionModal({
	title,
	description,
	onClose
}: {
	title: string
	description: string
	onClose: () => void
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
			<div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
				<div className="flex min-w-0 items-start justify-between gap-4 border-b border-zinc-800 p-5">
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Описание кейса
						</p>
						<h2 className="mt-2 line-clamp-2 break-all text-xl font-bold text-white">
							{title}
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
				<div className="overflow-y-auto p-5">
					<p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">
						{description}
					</p>
				</div>
			</div>
		</div>
	)
}

function CaseTagsModal({
	title,
	tags,
	onClose
}: {
	title: string
	tags: EventTagOption[]
	onClose: () => void
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
			<div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
				<div className="flex min-w-0 items-start justify-between gap-4 border-b border-zinc-800 p-5">
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Теги кейса
						</p>
						<h2 className="mt-2 line-clamp-2 break-all text-xl font-bold text-white">
							{title}
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
				<div className="overflow-y-auto p-5">
					<div className="flex flex-wrap gap-2">
						{tags.map(tag => (
							<span
								key={tag.idTag || tag.name}
								className="max-w-full break-all rounded-full border border-primary/40 px-3 py-1.5 text-sm text-primary"
							>
								{tag.name}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export function EventCaseCard({
	holder,
	title,
	description,
	tags = [],
	teamLimit,
	occupiedPlaces,
	dateForStartSelected,
	dateForEndSelected,
	actionLabel,
	onAction,
	disabled
}: Props) {
	const descriptionRef = useRef<HTMLParagraphElement | null>(null)
	const [isDescriptionOverflowing, setIsDescriptionOverflowing] =
		useState(false)
	const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)
	const [isTagsOpen, setIsTagsOpen] = useState(false)
	const visibleTags = tags.slice(0, 5)
	const hiddenTagsCount = Math.max(tags.length - visibleTags.length, 0)
	const descriptionText = description?.trim() || 'Описание кейса отсутствует.'

	useEffect(() => {
		const element = descriptionRef.current
		if (!element) return

		const updateOverflowState = () => {
			setIsDescriptionOverflowing(element.scrollHeight > element.clientHeight + 1)
		}

		updateOverflowState()

		const resizeObserver = new ResizeObserver(updateOverflowState)
		resizeObserver.observe(element)

		return () => {
			resizeObserver.disconnect()
		}
	}, [descriptionText])

	return (
		<>
			<article className="flex min-h-[280px] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
				<div className="flex min-w-0 items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="truncate text-xs uppercase tracking-[0.2em] text-zinc-500">
							{holder || 'Кейсодержатель не указан'}
						</p>
						<h3 className="mt-3 line-clamp-2 break-all text-xl font-bold">
							{title}
						</h3>
					</div>

					{teamLimit ? (
						<span className="shrink-0 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
							{occupiedPlaces ?? 0}/{teamLimit}
						</span>
					) : null}
				</div>

				<div className="mt-4 min-h-[72px]">
					<p
						ref={descriptionRef}
						className="line-clamp-3 break-words text-sm leading-6 text-zinc-400"
					>
						{descriptionText}
					</p>
					{isDescriptionOverflowing ? (
						<button
							type="button"
							onClick={() => setIsDescriptionOpen(true)}
							className="mt-1 text-sm font-medium text-primary hover:underline"
						>
							...ещё
						</button>
					) : null}
				</div>

				{tags.length ? (
					<div className="mt-4 flex min-h-[28px] flex-wrap gap-2 overflow-hidden">
						{visibleTags.map(tag => (
							<span
								key={tag.idTag || tag.name}
								className="max-w-[160px] truncate rounded-full border border-primary/40 px-2.5 py-1 text-xs text-primary"
								title={tag.name}
							>
								{tag.name}
							</span>
						))}
						{hiddenTagsCount > 0 ? (
							<button
								type="button"
								onClick={() => setIsTagsOpen(true)}
								className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-primary/60 hover:text-primary"
							>
								+{hiddenTagsCount}
							</button>
						) : null}
					</div>
				) : (
					<div className="mt-4 min-h-[28px]" />
				)}

				<p className="mt-4 text-xs text-zinc-500">
					{formatShortDateTimeRange(dateForStartSelected, dateForEndSelected)}
				</p>

				<div className="mt-auto flex flex-wrap gap-3 pt-5">
					<button
						type="button"
						onClick={onAction}
						disabled={disabled}
						className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{actionLabel}
					</button>
				</div>
			</article>

			{isDescriptionOpen ? (
				<CaseDescriptionModal
					title={title}
					description={descriptionText}
					onClose={() => setIsDescriptionOpen(false)}
				/>
			) : null}
			{isTagsOpen ? (
				<CaseTagsModal
					title={title}
					tags={tags}
					onClose={() => setIsTagsOpen(false)}
				/>
			) : null}
		</>
	)
}
