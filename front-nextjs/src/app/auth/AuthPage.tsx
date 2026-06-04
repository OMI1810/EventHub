import { AuthPageWrapper } from "./AuthPageWrapper";
import { AuthForm } from "./form/AuthForm";

interface Props {
  isLogin: boolean;
  authMode?: "default" | "turniket";
}

export function AuthPage({ isLogin, authMode = "default" }: Props) {
  const heading =
    authMode === "turniket"
      ? "Вход турникета"
      : isLogin
        ? "Авторизация"
        : "Регистрация";

  return (
    <AuthPageWrapper heading={heading}>
      <AuthForm isLogin={isLogin} authMode={authMode} />
    </AuthPageWrapper>
  );
}
