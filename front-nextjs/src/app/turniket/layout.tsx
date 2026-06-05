import { ReactNode } from 'react'

export default function TurniketLayout({
	children
}: {
	children: ReactNode
}) {
	return (
		<section className="-m-4 min-h-dvh w-[calc(100%+2rem)] max-w-none overflow-x-hidden bg-black text-white sm:-m-8 sm:w-[calc(100%+4rem)]">
			<div className="mx-auto min-h-dvh w-full max-w-none px-3 py-3 sm:max-w-5xl sm:px-4 sm:py-6">
				{children}
			</div>
		</section>
	)
}
