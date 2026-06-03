'use client'

import { PUBLIC_PAGES } from '@/config/pages/public.config'
import Link from 'next/link'

interface Props {
	primaryLabel?: string
	loginLabel?: string
}

export function EventAuthCtaRow({
	primaryLabel = 'Войти, чтобы участвовать',
	loginLabel = 'Войти'
}: Props) {
	return (
		<div className="flex flex-wrap gap-3">
			<Link
				href={PUBLIC_PAGES.LOGIN}
				className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
			>
				{loginLabel}
			</Link>
			<Link
				href={PUBLIC_PAGES.REGISTER}
				className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
			>
				Зарегистрироваться
			</Link>
			<Link
				href={PUBLIC_PAGES.LOGIN}
				className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white"
			>
				{primaryLabel}
			</Link>
		</div>
	)
}
