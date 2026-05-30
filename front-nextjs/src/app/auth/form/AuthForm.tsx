"use client";

import { MiniLoader } from "@/components/ui/MiniLoader";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { TRole } from "@/types/user.types";
import { twMerge } from "tailwind-merge";
import styles from "./AuthForm.module.scss";
import { AuthToggle } from "./AuthToggle";
import { useAuthForm } from "./useAuthForm";

interface Props {
  isLogin: boolean;
}

const roleOptions: Array<{ label: string; value: TRole }> = [
  { label: "Пользователь", value: "USER" },
  { label: "Администратор", value: "ADMIN" },
  { label: "Создатель организации", value: "ORGANIZATOR" },
];

export function AuthForm({ isLogin }: Props) {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm mx-auto">
      <div className="mb-4">
        <label className="text-gray-600">
          Email
          <input
            type="email"
            placeholder="Enter email: "
            {...register("email", { required: true })}
            className={styles["input-field"]}
          />
        </label>
      </div>

      <div className="mb-6">
        <label className="text-gray-600">
          Password
          <input
            type="password"
            placeholder="Enter password: "
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
                <label className="text-gray-600">
                  Адрес
                  <input
                    type="text"
                    placeholder="Введите адрес организации"
                    {...register("organizationAddress", { required: true })}
                    className={styles["input-field"]}
                  />
                </label>
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
          {isLoading ? <MiniLoader /> : isLogin ? "Sign In" : "Sign Up"}
        </button>
      </div>

      <AuthToggle isLogin={isLogin} />
    </form>
  );
}
