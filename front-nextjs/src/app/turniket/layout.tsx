import { ReactNode } from 'react'

export default function TurniketLayout({
	children
}: {
	children: ReactNode
}) {
	return (
		<section className="-m-8 min-h-screen w-[calc(100%+4rem)] max-w-none overflow-x-hidden bg-black text-white">
			<div className="mx-auto min-h-dvh w-full max-w-none px-1 py-2 sm:max-w-5xl sm:px-4 sm:py-6">
				{children}
			</div>
		</section>
	)
}
