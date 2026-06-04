'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface Props {
	children: ReactNode
	onLogout: () => void
	isLogoutLoading?: boolean
}

export function ProfileLayout({
	children,
	onLogout,
	isLogoutLoading = false
}: Props) {
	return (
		<div className="mx-auto grid w-full max-w-5xl min-w-0 gap-4 px-0 text-white sm:gap-6">
			<div className="flex justify-end">
				<button
					type="button"
					onClick={onLogout}
					disabled={isLogoutLoading}
					className={twMerge(
						'max-w-full rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800',
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
