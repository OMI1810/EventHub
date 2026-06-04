type TurniketResultOverlayProps = {
	description: string
	onClose: () => void
	title: string
	type: 'allow' | 'deny'
}

export function TurniketResultOverlay({
	description,
	onClose,
	title,
	type
}: TurniketResultOverlayProps) {
	return (
		<div
			onClick={onClose}
			className={`fixed inset-0 z-50 flex cursor-pointer items-center justify-center px-6 ${
				type === 'allow' ? 'bg-emerald-500' : 'bg-rose-600'
			}`}
		>
			<div className="text-center text-white">
				<div className="text-[8rem] font-black leading-none sm:text-[10rem]">
					{type === 'allow' ? '✓' : '✕'}
				</div>
				<p className="mt-4 text-3xl font-black uppercase tracking-[0.08em] sm:text-5xl">
					{title}
				</p>
				<p className="mx-auto mt-4 max-w-xl text-base font-medium leading-snug opacity-95 sm:text-2xl">
					{description}
				</p>
			</div>
		</div>
	)
}
