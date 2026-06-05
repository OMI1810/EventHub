import { MiniLoader } from '@/components/ui/MiniLoader'

type TurniketStatusPanelProps = {
	isScannerStarting: boolean
	isScanLocked: boolean
	scannerError: string | null
}

export function TurniketStatusPanel({
	isScannerStarting,
	isScanLocked,
	scannerError
}: TurniketStatusPanelProps) {
	let content: React.ReactNode

	if (scannerError) {
		content = <p className="break-words text-rose-300">{scannerError}</p>
	} else if (isScannerStarting) {
		content = (
			<div className="flex min-w-0 items-center gap-3 text-zinc-300">
				<MiniLoader width={18} height={18} />
				<span className="break-words">Запускаем камеру...</span>
			</div>
		)
	} else if (isScanLocked) {
		content = (
			<p className="break-words text-zinc-300">
				Проверяем считанный код...
			</p>
		)
	} else {
		content = (
			<p className="break-words">
				Наведите QR-код в центр рамки. После проверки зеленый экран
				означает проход, красный - отказ.
			</p>
		)
	}

	return (
		<section className="w-full rounded-[22px] border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-[0.82rem] leading-5 text-zinc-400 sm:rounded-[28px] sm:px-4 sm:py-3 sm:text-base">
			{content}
		</section>
	)
}
