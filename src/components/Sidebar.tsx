"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { path: "/", label: "대시보드" },
  { path: "/register", label: "회원등록" },
  { path: "/measurement", label: "측정/평가" },
  { path: "/list", label: "회원목록" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage) return null;

  return (
    <aside className="hidden lg:block w-72 border-r border-surface-200 bg-white">
      <div className="p-6 sticky top-16">
        <div className="text-xs font-extrabold tracking-widest text-surface-500 mb-4">MENU</div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${
                  isActive ? "bg-brand-50 text-brand-700 border border-brand-100" : "text-surface-700 hover:bg-surface-100"
                }`}
              >
                <span className={`text-sm font-semibold ${isActive ? "text-brand-700" : "text-surface-800"}`}>{item.label}</span>
                <span className={`text-xs font-bold ${isActive ? "text-brand-600" : "text-surface-400"}`}>›</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
