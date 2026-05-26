import { ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  heading: string;
}

export function AuthPageWrapper({ children, heading }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span className="text-2xl font-bold text-white">
          Delivery<span className="text-emerald-500">Hub</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
          {heading}
        </h2>
        {children}
      </div>

      <p className="mt-6 sm:mt-8 text-zinc-600 text-xs sm:text-sm text-center">
        © 2026 DeliveryHub. Все права не защищены.
      </p>
    </div>
  );
}
