import type { Metadata } from "next";
import { AuthPage } from "@/app/auth/AuthPage";

export const metadata: Metadata = {
  title: "Turniket Login",
};

export default function TurniketLoginPage() {
  return <AuthPage isLogin authMode="turniket" />;
}
