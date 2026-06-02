"use client";

import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { MiniLoader } from "@/components/ui/MiniLoader";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { useOrganization } from "@/hooks/useOrganization";
import organizationService from "@/services/organization.service";
import {
  IOrganizationSummary,
  IUpdateOrganizationFormData,
} from "@/types/organization.types";
import { formatPhone } from "@/utils/phone-mask";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

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
  onCancel: () => void;
  organization: IOrganizationSummary;
}

export function OrganizationEditForm({ onCancel, organization }: Props) {
  const queryClient = useQueryClient();
  const { organization: freshOrganization } = useOrganization();
  const [organizationCoordinates, setOrganizationCoordinates] = useState({
    cordinatX: organization.cordinatX ?? null,
    cordinatY: organization.cordinatY ?? null,
  });
  const { register, handleSubmit, reset, setValue, watch } =
    useForm<IUpdateOrganizationFormData>({
      defaultValues: {
        name: organization.name,
        description: organization.description ?? "",
        address: organization.address ?? "",
        cordinatX: organization.cordinatX ?? undefined,
        cordinatY: organization.cordinatY ?? undefined,
        phone: formatPhone(organization.owner.phone),
        contact: organization.owner.contact ?? "",
      },
    });

  useEffect(() => {
    const source = freshOrganization ?? organization;

    reset({
      name: source.name,
      description: source.description ?? "",
      address: source.address ?? "",
      cordinatX: source.cordinatX ?? undefined,
      cordinatY: source.cordinatY ?? undefined,
      phone: formatPhone(source.owner.phone),
      contact: source.owner.contact ?? "",
    });
    setOrganizationCoordinates({
      cordinatX: source.cordinatX ?? null,
      cordinatY: source.cordinatY ?? null,
    });
  }, [freshOrganization, organization, reset]);

  const { mutate: mutateUpdate, isPending } = useMutation({
    mutationKey: ["organization", "update"],
    mutationFn: (data: IUpdateOrganizationFormData) =>
      organizationService.updateMyOrganization(data),
    onSuccess(response) {
      queryClient.setQueryData(["organization", "me"], response);
      toast.success("Данные организации обновлены");
      onCancel();
    },
    onError() {
      toast.error("Не удалось обновить данные организации");
    },
  });

  const phoneValue = watch("phone") ?? "";
  const addressValue = watch("address") ?? "";

  return (
    <form
      onSubmit={handleSubmit((data) => mutateUpdate(data))}
      className="mt-6 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-zinc-300">
          Название организации
          <input
            type="text"
            {...register("name")}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
          />
        </label>

        <label className="text-sm text-zinc-300">
          Телефон
          <PhoneInput
            value={phoneValue}
            onChange={(value) =>
              setValue("phone", value, { shouldDirty: true })
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
          />
        </label>

        <label className="text-sm text-zinc-300 sm:col-span-2">
          Дополнительный контакт
          <input
            type="text"
            {...register("contact")}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
          />
        </label>

        <label className="text-sm text-zinc-300 sm:col-span-2">
          Описание
          <textarea
            rows={4}
            {...register("description")}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
          />
        </label>

        <div className="sm:col-span-2">
          <AddressAutocomplete
            label="Адрес"
            value={addressValue}
            onManualChange={(address) => {
              setValue("address", address, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("cordinatX", undefined, { shouldDirty: true });
              setValue("cordinatY", undefined, { shouldDirty: true });
              setOrganizationCoordinates({
                cordinatX: null,
                cordinatY: null,
              });
            }}
            onSelect={(address) => {
              setValue("address", address.address, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("cordinatX", address.cordinatX, { shouldDirty: true });
              setValue("cordinatY", address.cordinatY, { shouldDirty: true });
              setOrganizationCoordinates({
                cordinatX: address.cordinatX,
                cordinatY: address.cordinatY,
              });
            }}
          />
        </div>

        <div className="sm:col-span-2">
          <ArcGisPointMap
            cordinatX={organizationCoordinates.cordinatX}
            cordinatY={organizationCoordinates.cordinatY}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Отмена
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <MiniLoader width={20} height={20} /> : "Сохранить"}
        </button>
      </div>
    </form>
  );
}
