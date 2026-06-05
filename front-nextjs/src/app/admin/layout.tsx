"use client";

import { MiniLoader } from "@/components/ui/MiniLoader";
import { useProfile } from "@/hooks/useProfile";
import { ReactNode } from "react";
import { AdminShell } from "./AdminShell";

function AdminAccessDenied() {
  return (
    <div className="mx-auto mt-10 max-w-3xl rounded-md border border-zinc-800 bg-zinc-900 p-6 text-white">
      <h1 className="text-2xl font-bold">Недостаточно прав</h1>
      <p className="mt-3 text-sm text-zinc-400">
        У вас недостаточно прав для доступа к панели администратора.
      </p>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isLoading, user } = useProfile();

  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <MiniLoader width={150} height={150} />
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return <AdminAccessDenied />;
  }

  return (
    <div className="relative -mx-1 -mt-1 min-h-[calc(100dvh-0.25rem)] w-[calc(100%+0.5rem)] max-w-none self-stretch sm:-mx-8 sm:-mt-8 sm:min-h-[calc(100dvh-4rem)] sm:w-[calc(100%+4rem)]">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
