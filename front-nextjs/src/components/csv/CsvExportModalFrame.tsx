'use client'

import { ReactNode } from 'react'

interface Props {
	title: string
	children: ReactNode
	footer: ReactNode
	onClose: () => void
}

export function CsvExportModalFrame({
	title,
	children,
	footer,
	onClose
}: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
			<div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl">
				<div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
					<h2 className="min-w-0 break-words text-lg font-semibold text-zinc-100 [overflow-wrap:anywhere]">
						{title}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="shrink-0 rounded-md px-2 py-1 text-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
					>
						x
					</button>
				</div>
				<div className="overflow-y-auto px-5 py-4">{children}</div>
				<div className="flex justify-end gap-3 border-t border-zinc-800 px-5 py-4">
					{footer}
				</div>
			</div>
		</div>
	)
}
