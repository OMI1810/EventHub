const DEFAULT_LOCALE = 'ru-RU'
const DEFAULT_TIME_ZONE = 'Europe/Moscow'

export function formatDateTime(
	value?: string | Date | null,
	options?: Intl.DateTimeFormatOptions
) {
	if (!value) return 'Не указано'

	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return 'Не указано'

	return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
		timeZone: DEFAULT_TIME_ZONE,
		...options
	}).format(date)
}

export function formatDateTimeRange(
	start?: string | Date | null,
	end?: string | Date | null,
	options?: Intl.DateTimeFormatOptions
) {
	return `${formatDateTime(start, options)} - ${formatDateTime(end, options)}`
}

export function formatEventDateRange(
	start?: string | Date | null,
	end?: string | Date | null
) {
	return formatDateTimeRange(start, end, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
}

export function formatShortDateTimeRange(
	start?: string | Date | null,
	end?: string | Date | null
) {
	return formatDateTimeRange(start, end, {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	})
}
