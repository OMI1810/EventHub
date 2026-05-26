"use client";
import addressService from "@/services/address.service";
import { IAddressUser } from "@/types/address.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MiniLoader } from "@/components/ui/MiniLoader";

export function AddressList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressService.getAll(),
  });

  const { mutate: removeAddress, isPending: isDeleting } = useMutation({
    mutationKey: ["delete-address"],
    mutationFn: (id: string) => addressService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <MiniLoader />
      </div>
    );
  }

  const addressUsers: IAddressUser[] = data?.data || [];

  if (addressUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">У вас пока нет сохранённых адресов</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addressUsers.map((item: IAddressUser) => {
        const addr = item.address;
        return (
          <div
            key={addr.idAddress}
            className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">
                  {addr.address}
                </p>
                <div className="text-xs text-zinc-400 mt-1.5 space-y-0.5">
                  {addr.flat && <p>Кв: {addr.flat}</p>}
                  {addr.floor && <p>Этаж: {addr.floor}</p>}
                  {addr.entrance && <p>Подъезд: {addr.entrance}</p>}
                  {addr.doorphone && <p>Домофон: {addr.doorphone}</p>}
                  {addr.comment && (
                    <p className="truncate">Комментарий: {addr.comment}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeAddress(addr.idAddress)}
                disabled={isDeleting}
                className="ml-3 text-red-400 hover:text-red-300 disabled:text-zinc-600 transition-colors shrink-0"
              >
                {isDeleting ? "..." : "✕"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
