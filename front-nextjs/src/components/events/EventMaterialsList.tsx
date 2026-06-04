'use client'

interface MaterialItem {
	idMaterial: string
	title: string
	description?: string | null
	url: string
}

interface Props {
	materials: MaterialItem[]
	selectedCase?: {
		title: string
		holder?: string | null
	} | null
}

export function EventMaterialsList({ materials, selectedCase }: Props) {
	return (
		<div className="grid min-w-0 gap-4">
			{selectedCase ? (
				<div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4">
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						Выбранный кейс
					</p>
					<h3 className="mt-3 line-clamp-2 break-all text-lg font-semibold text-zinc-100">
						{selectedCase.title}
					</h3>
					<p className="mt-2 line-clamp-2 break-words text-sm text-zinc-400">
						{selectedCase.holder || 'Кейсодержатель не указан'}
					</p>
				</div>
			) : null}

			{materials.map(material => (
				<a
					key={material.idMaterial}
					href={material.url}
					target="_blank"
					rel="noreferrer"
					className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4 transition-colors hover:border-emerald-500/40 hover:bg-zinc-950"
				>
					<p className="line-clamp-2 break-all text-sm font-semibold text-zinc-100">
						{material.title}
					</p>
					<p className="mt-2 line-clamp-2 break-all text-sm text-zinc-400">
						{material.description || material.url}
					</p>
				</a>
			))}
		</div>
	)
}
