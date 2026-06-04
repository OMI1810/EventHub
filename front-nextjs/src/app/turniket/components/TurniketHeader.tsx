type TurniketHeaderProps = {
	isLoggingOut: boolean
	onLogout: () => void
}

export function TurniketHeader({
	isLoggingOut,
	onLogout
}: TurniketHeaderProps) {
	return (
		<header className="w-full rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-3 sm:rounded-[28px] sm:p-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<p className="text-[0.7rem] uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
						Турникет
					</p>
					<h1 className="mt-1 max-w-full break-words text-[1.6rem] font-semibold leading-[1] text-zinc-50 sm:mt-2 sm:text-4xl">
						Сканирование пропуска
					</h1>
				</div>

				<button
					type="button"
					onClick={onLogout}
					disabled={isLoggingOut}
					className="self-start rounded-xl border border-zinc-700 px-3.5 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900 disabled:opacity-60"
				>
					{isLoggingOut ? 'Выходим...' : 'Выйти'}
				</button>
			</div>
		</header>
	)
}
