"use client";

import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { MiniLoader } from "@/components/ui/MiniLoader";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { TRole } from "@/types/user.types";
import { twMerge } from "tailwind-merge";
import styles from "./AuthForm.module.scss";
import { AuthToggle } from "./AuthToggle";
import { useAuthForm } from "./useAuthForm";

interface Props {
  isLogin: boolean;
  authMode?: "default" | "turniket";
}

const roleOptions: Array<{ label: string; value: TRole }> = [
  { label: "Пользователь", value: "USER" },
  { label: "Администратор", value: "ADMIN" },
  { label: "Создатель организации", value: "ORGANIZATOR" },
];

export function AuthForm({ isLogin, authMode = "default" }: Props) {
  const {
    handleSubmit,
    isLoading,
    onSubmit,
    register,
    selectedRole,
    setValue,
    watch,
  } = useAuthForm(isLogin, authMode);

  const phoneValue = watch("phone") ?? "";
  const cityValue = watch("city") ?? "";
  const isRegularUser = selectedRole === "USER";
  const isTurniketMode = authMode === "turniket";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-2xl">
      <div className="mb-4">
        <label className="text-gray-600">
          {isTurniketMode ? "Логин" : "Email"}
          <input
            type={isTurniketMode ? "text" : "email"}
            placeholder={
              isTurniketMode ? "Введите логин турникета" : "Введите почту"
            }
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
            placeholder="Введите пароль"
            {...register("password", { required: true })}
            className={styles["input-field"]}
          />
        </label>
      </div>

      {!isLogin && !isTurniketMode ? (
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

          {selectedRole !== "ORGANIZATOR" ? (
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
                    <AddressAutocomplete
                      label="Город"
                      value={cityValue}
                      required
                      placeholder="Введите город"
                      emptyText="Города не найдены"
                      labelClassName="relative block text-gray-600"
                      inputClassName={styles["input-field"]}
                      onManualChange={(value) =>
                        setValue("city", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      onSelect={(address) =>
                        setValue(
                          "city",
                          address.address.split(",")[0]?.trim() || address.address,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        )
                      }
                    />
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          <label className="mb-5 flex items-start gap-3 text-sm text-gray-600">
            <input
              type="checkbox"
              {...register("personalDataConsent", { required: true })}
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
            />
            <span>Я согласен на обработку персональных данных</span>
          </label>
        </>
      ) : null}

      <div className="mb-3">
        <button
          type="submit"
          className={twMerge(
            styles["btn-primary"],
            isLogin ? "bg-primary" : "bg-secondary",
            isLoading && "cursor-not-allowed opacity-75",
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <MiniLoader />
          ) : isTurniketMode ? (
            "Войти как турникет"
          ) : isLogin ? (
            "Авторизация"
          ) : (
            "Регистрация"
          )}
        </button>
      </div>

      {!isTurniketMode ? <AuthToggle isLogin={isLogin} /> : null}
    </form>
  );
}
