"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, ownerName, logout } = useAuthStore();

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage) return null;

  const handleLoginClick = () => {
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-200 bg-white/85 backdrop-blur">
      <div className="container-page h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold tracking-tight">F</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm text-surface-500 font-semibold">Smart Fitness</div>
              <div className="text-base font-extrabold text-surface-900 tracking-tight">FitSpec</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/register" className="px-3 py-2 rounded-xl text-surface-700 font-semibold hover:bg-surface-100 transition-colors">
              회원등록
            </Link>
            <Link href="/measurement" className="px-3 py-2 rounded-xl text-surface-700 font-semibold hover:bg-surface-100 transition-colors">
              측정/평가
            </Link>
            <Link href="/list" className="px-3 py-2 rounded-xl text-surface-700 font-semibold hover:bg-surface-100 transition-colors">
              회원목록
            </Link>
          </nav>
        </div>
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-surface-100 px-3 py-2">
              <div className="w-8 h-8 bg-white border border-surface-200 rounded-lg flex items-center justify-center">
                <span className="text-surface-700 font-bold text-sm">{ownerName?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-surface-800 font-semibold">{ownerName}님</span>
            </div>
            <button onClick={logout} className="btn-ghost text-red-600 hover:bg-red-50">
              로그아웃
            </button>
          </div>
        ) : (
          <button onClick={handleLoginClick} className="btn-primary">
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
