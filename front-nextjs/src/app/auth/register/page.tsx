import type { Metadata } from "next";
import { AuthPage } from "../AuthPage";

export const metadata: Metadata = {
  title: "Регистрация",
};

export default function RegisterPage() {
  return <AuthPage isLogin={false} />;
}
