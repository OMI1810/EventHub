'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type PropsWithChildren, useState } from 'react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: PropsWithChildren) {
	const [client] = useState(new QueryClient())

	return (
		<QueryClientProvider client={client}>
			{children}
			<Toaster />
		</QueryClientProvider>
	)
}
