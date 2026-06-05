'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import Link from 'next/link'
import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface Props {
	children: ReactNode
	onLogout: () => void
	isLogoutLoading?: boolean
	homeHref?: string
	homeLabel?: string
}

export function ProfileLayout({
	children,
	onLogout,
	isLogoutLoading = false,
	homeHref,
	homeLabel = 'Главная'
}: Props) {
	return (
		<div className="mx-auto grid w-full max-w-5xl min-w-0 gap-4 px-0 text-white sm:gap-6">
			<div className="flex flex-wrap justify-end gap-3">
				{homeHref ? (
					<Link
						href={homeHref}
						className="inline-flex max-w-full items-center justify-center rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
					>
						{homeLabel}
					</Link>
				) : null}
				<button
					type="button"
					onClick={onLogout}
					disabled={isLogoutLoading}
					className={twMerge(
						'inline-flex max-w-full items-center justify-center rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800',
						isLogoutLoading && 'cursor-not-allowed opacity-60'
					)}
				>
					{isLogoutLoading ? (
						<MiniLoader width={20} height={20} />
					) : (
						'Выйти'
					)}
				</button>
			</div>

			{children}
		</div>
	)
}
