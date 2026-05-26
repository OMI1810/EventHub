import { AuthPageWrapper } from './AuthPageWrapper'
import { AuthForm } from './form/AuthForm'

interface Props {
	isLogin: boolean
}

export function AuthPage({ isLogin }: Props) {
	return (
		<AuthPageWrapper heading={isLogin ? 'Sign In' : 'Sign Up'}>
			<AuthForm isLogin={isLogin} />
		</AuthPageWrapper>
	)
}
