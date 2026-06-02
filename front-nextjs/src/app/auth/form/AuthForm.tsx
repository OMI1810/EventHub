"use client";

import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { MiniLoader } from "@/components/ui/MiniLoader";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { TRole } from "@/types/user.types";
import dynamic from "next/dynamic";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import styles from "./AuthForm.module.scss";
import { AuthToggle } from "./AuthToggle";
import { useAuthForm } from "./useAuthForm";

const ArcGisPointMap = dynamic(
  () =>
    import("@/components/map/ArcGisPointMap").then(
      (module) => module.ArcGisPointMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-md border border-zinc-700 bg-zinc-950" />
    ),
  },
);

interface Props {
  isLogin: boolean;
}

const roleOptions: Array<{ label: string; value: TRole }> = [
  { label: "Пользователь", value: "USER" },
  { label: "Администратор", value: "ADMIN" },
  { label: "Создатель организации", value: "ORGANIZATOR" },
];

export function AuthForm({ isLogin }: Props) {
  const [organizationCoordinates, setOrganizationCoordinates] = useState<{
    cordinatX: number | null;
    cordinatY: number | null;
  }>({
    cordinatX: null,
    cordinatY: null,
  });

  const {
    handleSubmit,
    isLoading,
    onSubmit,
    register,
    selectedRole,
    setValue,
    watch,
  } = useAuthForm(isLogin);

  const isOrganizationCreator = selectedRole === "ORGANIZATOR";
  const phoneValue = watch("phone") ?? "";
  const isRegularUser = selectedRole === "USER";
  const organizationAddress = watch("organizationAddress") ?? "";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="mb-4">
        <label className="text-gray-600">
          Email
          <input
            type="email"
            placeholder="Введите почту: "
            {...register("email", { required: true })}
            className={styles["input-field"]}
          />
        </label>
      </div>

      <div className="mb-6">
        <label className="text-gray-600">
          Пароль
          <input
            type="password"
            placeholder="Введите пароль: "
            {...register("password", { required: true })}
            className={styles["input-field"]}
          />
        </label>
      </div>

      {!isLogin && (
        <>
          <div className="mb-4">
            <label className="text-gray-600">
              Телефон
              <PhoneInput
                placeholder="Введите телефон"
                value={phoneValue}
                onChange={(value) =>
                  setValue("phone", value, { shouldDirty: true })
                }
                className={styles["input-field"]}
              />
            </label>
          </div>

          <div className="mb-4">
            <label className="text-gray-600">
              Доп. контакт
              <input
                type="text"
                placeholder="MAX, VK или другой контакт"
                {...register("contact")}
                className={styles["input-field"]}
              />
            </label>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-gray-600">Как вы себя идентифицируете</p>
            <div className="grid gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setValue("role", role.value)}
                  className={twMerge(
                    styles["role-button"],
                    selectedRole === role.value && styles["role-button-active"],
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {isOrganizationCreator ? (
            <>
              <div className="mb-4">
                <label className="text-gray-600">
                  Название организации
                  <input
                    type="text"
                    placeholder="Введите название организации"
                    {...register("organizationName", { required: true })}
                    className={styles["input-field"]}
                  />
                </label>
              </div>

              <div className="mb-4">
                <label className="text-gray-600">
                  Описание
                  <textarea
                    placeholder="Краткое описание организации"
                    {...register("organizationDescription")}
                    className={styles["input-field"]}
                    rows={3}
                  />
                </label>
              </div>

              <div className="mb-4">
                <AddressAutocomplete
                  label="Адрес"
                  value={organizationAddress}
                  required
                  onManualChange={(address) => {
                    setValue("organizationAddress", address, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue("organizationCordinatX", undefined, {
                      shouldDirty: true,
                    });
                    setValue("organizationCordinatY", undefined, {
                      shouldDirty: true,
                    });
                    setOrganizationCoordinates({
                      cordinatX: null,
                      cordinatY: null,
                    });
                  }}
                  onSelect={(address) => {
                    setValue("organizationAddress", address.address, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue("organizationCordinatX", address.cordinatX, {
                      shouldDirty: true,
                    });
                    setValue("organizationCordinatY", address.cordinatY, {
                      shouldDirty: true,
                    });
                    setOrganizationCoordinates({
                      cordinatX: address.cordinatX,
                      cordinatY: address.cordinatY,
                    });
                  }}
                />
              </div>

              <div className="mb-4">
                <ArcGisPointMap
                  cordinatX={organizationCoordinates.cordinatX}
                  cordinatY={organizationCoordinates.cordinatY}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="text-gray-600">
                  Фамилия
                  <input
                    type="text"
                    placeholder="Введите фамилию"
                    {...register("surname")}
                    className={styles["input-field"]}
                  />
                </label>
              </div>

              <div className="mb-4">
                <label className="text-gray-600">
                  Имя
                  <input
                    type="text"
                    placeholder="Введите имя"
                    {...register("name")}
                    className={styles["input-field"]}
                  />
                </label>
              </div>

              <div className="mb-4">
                <label className="text-gray-600">
                  Отчество
                  <input
                    type="text"
                    placeholder="Введите отчество"
                    {...register("patronymic")}
                    className={styles["input-field"]}
                  />
                </label>
              </div>

              {isRegularUser ? (
                <>
                  <div className="mb-4">
                    <label className="text-gray-600">
                      Дата рождения
                      <input
                        type="date"
                        {...register("birthDate", { required: true })}
                        className={styles["input-field"]}
                      />
                    </label>
                  </div>

                  <div className="mb-4">
                    <label className="text-gray-600">
                      Город
                      <input
                        type="text"
                        placeholder="Введите город"
                        {...register("city", { required: true })}
                        className={styles["input-field"]}
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </>
          )}
        </>
      )}

      <div className="mb-3">
        <button
          type="submit"
          className={twMerge(
            styles["btn-primary"],
            isLogin ? "bg-primary" : "bg-secondary",
            isLoading && "opacity-75 cursor-not-allowed",
          )}
          disabled={isLoading}
        >
          {isLoading ? <MiniLoader /> : isLogin ? "Авторизация" : "Регистрация"}
        </button>
      </div>

      <AuthToggle isLogin={isLogin} />
    </form>
  );
}
