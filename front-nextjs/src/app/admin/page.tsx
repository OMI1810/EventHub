import { redirect } from "next/navigation";
import { ADMIN_PAGES } from "@/config/pages/admin.config";

export default function Page() {
  redirect(ADMIN_PAGES.EVENTS);
}
