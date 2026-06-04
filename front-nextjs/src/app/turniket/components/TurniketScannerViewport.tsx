import { RefObject } from 'react'

type TurniketScannerViewportProps = {
	videoRef: RefObject<HTMLVideoElement | null>
}

export function TurniketScannerViewport({
	videoRef
}: TurniketScannerViewportProps) {
	return (
		<section className="w-full rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-2 sm:rounded-[28px] sm:p-5">
			<div className="relative overflow-hidden rounded-[24px] border border-zinc-800 bg-black sm:rounded-[28px]">
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className="h-[68dvh] min-h-[460px] w-full object-cover sm:h-[78vh] sm:min-h-[620px]"
				/>

				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="flex h-[58%] w-[88%] max-h-[420px] max-w-[520px] items-center justify-center rounded-[1.6rem] border-[4px] border-white/95 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.16)] sm:rounded-[2rem]">
						<div className="h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-[1.2rem] border border-white/25 sm:rounded-[1.4rem]" />
					</div>
				</div>
			</div>
		</section>
	)
}
