"use client";

import { PUBLIC_PAGES } from "@/config/pages/public.config";
import authService from "@/services/auth/auth.service";
import { IFormData } from "@/types/auth.types";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

export function useAuthForm(isLogin: boolean) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<IFormData>(
    {
      defaultValues: {
        role: "USER",
      },
    },
  );

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [twoFactorState, setTwoFactorState] = useState<{
    token: string;
    email: string;
  } | null>(null);

  const { mutate: mutateLogin, isPending: isLoginPending } = useMutation({
    mutationKey: ["login"],
    mutationFn: (data: IFormData) => authService.main("login", data),
    onSuccess(response) {
      if (
        "requiresTwoFactor" in response.data &&
        response.data.requiresTwoFactor
      ) {
        setTwoFactorState({
          token: response.data.twoFactorToken,
          email: response.data.email,
        });
        toast.success("Код подтверждения отправлен на почту");
        return;
      }

      startTransition(() => {
        reset();
        router.push(PUBLIC_PAGES.HOME);
      });
    },
    onError(error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message);
      }
    },
  });

  const { mutate: mutateVerifyTwoFactor, isPending: isVerifyTwoFactorPending } =
    useMutation({
      mutationKey: ["login", "verify-2fa"],
      mutationFn: (code: string) => {
        if (!twoFactorState) {
          throw new Error("Two-factor token is missing");
        }

        return authService.verifyTwoFactor({
          twoFactorToken: twoFactorState.token,
          code,
        });
      },
      onSuccess() {
        startTransition(() => {
          setTwoFactorState(null);
          reset();
          router.push(PUBLIC_PAGES.HOME);
        });
      },
      onError(error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message);
        }
      },
    });

  const { mutate: mutateResendTwoFactor, isPending: isResendTwoFactorPending } =
    useMutation({
      mutationKey: ["login", "resend-2fa"],
      mutationFn: () => {
        if (!twoFactorState) {
          throw new Error("Two-factor token is missing");
        }

        return authService.resendTwoFactor(twoFactorState.token);
      },
      onSuccess(response) {
        setTwoFactorState((current) =>
          current
            ? {
                ...current,
                token: response.data.twoFactorToken,
              }
            : current,
        );
        toast.success("Код подтверждения отправлен повторно");
      },
      onError(error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message);
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
        toast.error(error.response?.data?.message);
      }
    },
  });

  const onSubmit: SubmitHandler<IFormData> = (data) => {
    if (isLogin) {
      mutateLogin({
        email: data.email,
        password: data.password,
      });
      return;
    }

    const { personalDataConsent: _personalDataConsent, ...payload } = data;
    mutateRegister(payload);
  };

  const isLoading =
    isPending ||
    isLoginPending ||
    isRegisterPending ||
    isVerifyTwoFactorPending ||
    isResendTwoFactorPending;

  return {
    register,
    handleSubmit,
    onSubmit,
    isLoading,
    selectedRole: watch("role") ?? "USER",
    setValue,
    twoFactorState,
    verifyTwoFactor: (code: string) => mutateVerifyTwoFactor(code),
    resendTwoFactor: () => mutateResendTwoFactor(),
    watch,
  };
}
