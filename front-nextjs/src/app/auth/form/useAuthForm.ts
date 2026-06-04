"use client";

import { PUBLIC_PAGES } from "@/config/pages/public.config";
import authService from "@/services/auth/auth.service";
import { IFormData } from "@/types/auth.types";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

export function useAuthForm(
  isLogin: boolean,
  authMode: "default" | "turniket" = "default",
) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<IFormData>(
    {
      defaultValues: {
        role: "USER",
      },
    },
  );

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { mutate: mutateLogin, isPending: isLoginPending } = useMutation({
    mutationKey: ["login"],
    mutationFn: (data: IFormData) =>
      authMode === "turniket"
        ? authService.loginTurniket({
            login: data.email,
            password: data.password,
          })
        : authService.main("login", data),
    onSuccess(response) {
      if (authMode === "turniket" && response.data.user.role !== "TURNIKET") {
        void authService.logout();
        toast.error("Этот вход предназначен только для турникетов");
        return;
      }

      startTransition(() => {
        reset();
        router.push(authMode === "turniket" ? "/turniket" : PUBLIC_PAGES.HOME);
      });
    },
    onError(error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Не удалось выполнить вход";
        toast.error(message);
      }
    },
  });

  const { mutate: mutateRegister, isPending: isRegisterPending } = useMutation({
    mutationKey: ["register"],
    mutationFn: (data: IFormData) => authService.main("register", data),
    onSuccess() {
      startTransition(() => {
        reset();
        router.push(PUBLIC_PAGES.HOME);
      });
    },
    onError(error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Не удалось выполнить регистрацию";
        toast.error(message);
      }
    },
  });

  const onSubmit: SubmitHandler<IFormData> = (data) => {
    if (isLogin) {
      mutateLogin({
        email: data.email,
        password: data.password,
      });
    } else {
      const { personalDataConsent: _personalDataConsent, ...payload } = data;

      mutateRegister(payload);
    }
  };

  const isLoading = isPending || isLoginPending || isRegisterPending;

  return {
    register,
    handleSubmit,
    onSubmit,
    isLoading,
    selectedRole: watch("role") ?? "USER",
    setValue,
    watch,
  };
}
