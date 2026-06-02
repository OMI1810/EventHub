import { PUBLIC_PAGES } from "@/config/pages/public.config";
import { useRouter } from "next/navigation";

export function AuthToggle({ isLogin }: { isLogin: boolean }) {
  const router = useRouter();

  return (
    <div className="text-center text-base mt-3">
      {isLogin ? (
        <p>
          Нету аккаунт?{" "}
          <button
            type="button"
            className="text-rose-300 text-base"
            onClick={() => router.push(PUBLIC_PAGES.REGISTER)}
          >
            Регистрация
          </button>
        </p>
      ) : (
        <p>
          Уже есть аккаунт?{" "}
          <button
            type="button"
            className="text-emerald-300 text-base"
            onClick={() => router.push(PUBLIC_PAGES.LOGIN)}
          >
            Авторизация
          </button>
        </p>
      )}
    </div>
  );
}
