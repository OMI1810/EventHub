"use client";

import { ADMIN_PAGES } from "@/config/pages/admin.config";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";

const NAV_ITEMS = [
  {
    href: ADMIN_PAGES.EVENTS,
    label: "Мероприятия",
    description: "Список мероприятий и переход к управлению",
  },
  {
    href: ADMIN_PAGES.EVENT_CREATE,
    label: "Создать мероприятие",
    description: "Новая рабочая область создания мероприятия",
  },
  {
    href: ADMIN_PAGES.PROFILE,
    label: "Профиль",
    description: "Личные данные, организации и поданные заявки",
  },
];

function isItemActive(pathname: string, href: string) {
  if (href === ADMIN_PAGES.EVENTS) {
    return (
      pathname === ADMIN_PAGES.EVENTS ||
      (pathname.startsWith(`${ADMIN_PAGES.EVENTS}/`) &&
        pathname !== ADMIN_PAGES.EVENT_CREATE)
    );
  }

  return pathname === href;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const isEventWorkspace =
    pathname.startsWith(`${ADMIN_PAGES.EVENTS}/`) &&
    pathname !== ADMIN_PAGES.EVENT_CREATE;

  return (
    <aside className="w-full shrink-0 border-b border-zinc-800 bg-zinc-900 p-5 lg:h-dvh lg:w-[320px] lg:border-b-0 lg:border-r">
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Админ-панель
          </p>
          <p className="mt-3 text-lg font-semibold text-zinc-100">
            Управление EventHub
          </p>
        </div>

        <div className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={twMerge(
                  "block w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-800 text-zinc-100 hover:bg-zinc-800",
                )}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
              </Link>
            );
          })}
        </div>

        {isEventWorkspace ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Открыто сейчас
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-100">
              Конкретное мероприятие
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Вы находитесь внутри рабочей области выбранного мероприятия.
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
