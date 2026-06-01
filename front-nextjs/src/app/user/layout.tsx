import type { ReactNode } from 'react'
import { UserShell } from './UserShell'

export default function UserLayout({
	children
}: Readonly<{
	children: ReactNode
}>) {
	return <UserShell>{children}</UserShell>
}
