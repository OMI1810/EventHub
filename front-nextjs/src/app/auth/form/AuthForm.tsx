"use client";

import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { MiniLoader } from "@/components/ui/MiniLoader";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { TRole } from "@/types/user.types";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { AuthToggle } from "./AuthToggle";
import styles from "./AuthForm.module.scss";
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


export function AuthForm({ isLogin }: Props) {
  const [isPersonalDataModalOpen, setIsPersonalDataModalOpen] = useState(false);

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

    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto w-full max-w-2xl"
    >
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

            <span>
              Я согласен на{" "}
              <button
                type="button"
                onClick={() => setIsPersonalDataModalOpen(true)}
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                обработку персональных данных
              </button>
            </span>
          </label>
        </>
      ) : null}

      {isPersonalDataModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Обработка персональных данных
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Для регистрации и работы аккаунта обрабатываются данные,
                  которые вы указываете в форме.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonalDataModalOpen(false)}
                className="rounded-md px-2 py-1 text-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              >
                x
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-zinc-300">
              <div>
                <p className="font-medium text-zinc-100">Общие данные</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Email</li>
                  <li>Телефон</li>
                  <li>Дополнительный контакт, если он указан</li>
                  <li>Выбранная роль аккаунта</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-zinc-100">
                  Для пользователя и администратора
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Фамилия, имя и отчество, если они указаны</li>
                  <li>Дата рождения</li>
                  <li>Город</li>
                </ul>
              </div>

              <p className="text-zinc-400">
                Эти данные нужны для создания аккаунта, связи с вами,
                определения роли и предоставления доступа к функциям сервиса.
                Они точто не будут сливаться в даркнет.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPersonalDataModalOpen(false)}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/80"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
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
