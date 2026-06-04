'use client'

import { EventAuthCtaRow } from './EventAuthCtaRow'

interface Props {
	text: string
	showAuthCta?: boolean
}

export function EventAccessNotice({ text, showAuthCta = false }: Props) {
	return (
		<div className="min-w-0 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-5 py-8 text-sm leading-6 text-zinc-400">
			<p className="break-words">{text}</p>
			{showAuthCta ? (
				<div className="mt-5">
					<EventAuthCtaRow />
				</div>
			) : null}
		</div>
	)
}
