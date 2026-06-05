"use client";

import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: ReactNode;
}

export function AdminShell({ children }: Props) {
  return (
    <div className="flex min-h-screen w-full flex-col text-white lg:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1 overflow-y-auto px-4 py-8 lg:px-8">
        {children}
      </div>
    </div>
  );
}
