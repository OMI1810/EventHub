import { RefObject } from 'react'

type TurniketScannerViewportProps = {
	videoRef: RefObject<HTMLVideoElement | null>
}

export function TurniketScannerViewport({
	videoRef
}: TurniketScannerViewportProps) {
	return (
		<section className="w-full rounded-[22px] border border-zinc-800 bg-zinc-950/80 p-2 sm:rounded-[28px] sm:p-5">
			<div className="relative overflow-hidden rounded-[20px] border border-zinc-800 bg-black sm:rounded-[28px]">
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className="h-[58dvh] min-h-[280px] max-h-[560px] w-full object-cover sm:h-[70dvh] sm:min-h-[420px] lg:h-[72dvh] lg:min-h-[560px]"
				/>

				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="flex aspect-square w-[76%] max-w-[360px] items-center justify-center rounded-[1.4rem] border-[3px] border-white/95 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.16)] sm:w-[58%] sm:max-w-[520px] sm:rounded-[2rem] sm:border-[4px]">
						<div className="h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-[1.1rem] border border-white/25 sm:rounded-[1.4rem]" />
					</div>
				</div>
			</div>
		</section>
	)
}
