"use client";

import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { MiniLoader } from "@/components/ui/MiniLoader";
import organizationService from "@/services/organization.service";
import { ICreateOrganizationFormData } from "@/types/organization.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
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

export function OrganizationCreateForm() {
  const queryClient = useQueryClient();
  const [organizationCoordinates, setOrganizationCoordinates] = useState({
    cordinatX: null as number | null,
    cordinatY: null as number | null,
  });
  const { register, handleSubmit, setValue, watch } =
    useForm<ICreateOrganizationFormData>({
      defaultValues: {
        name: "",
        description: "",
        address: "",
      },
    });

  const { mutate: mutateCreate, isPending } = useMutation({
    mutationKey: ["organization", "create"],
    mutationFn: (data: ICreateOrganizationFormData) =>
      organizationService.createMyOrganization(data),
    onSuccess(response) {
      queryClient.setQueryData(["organization", "me"], response);
      toast.success("Организация создана");
    },
    onError() {
      toast.error("Не удалось создать организацию");
    },
  });

  const addressValue = watch("address") ?? "";

  return (
    <form
      onSubmit={handleSubmit((data) => mutateCreate(data))}
      className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-xl"
    >
      <h1 className="text-2xl font-bold">Создание организации</h1>
      <p className="mt-3 text-sm text-zinc-400">
        После подтверждения почты создайте организацию, чтобы открыть панель
        управления.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-zinc-300 sm:col-span-2">
          Название организации
          <input
            type="text"
            {...register("name", { required: true })}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
          />
        </label>

        <label className="text-sm text-zinc-300 sm:col-span-2">
          Описание
          <textarea
            rows={4}
            {...register("description")}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
          />
        </label>

        <div className="sm:col-span-2">
          <AddressAutocomplete
            label="Адрес"
            value={addressValue}
            required
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

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <MiniLoader width={20} height={20} /> : "Создать"}
        </button>
      </div>
    </form>
  );
}
