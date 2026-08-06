"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Gamepad2, Trophy, UploadCloud, LogOut } from "lucide-react";

interface SidebarProps {
  lang: "ja" | "en";
  nickname?: string;
  onLogout: () => void;
}

export function Sidebar({ lang, nickname, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="hidden md:flex w-64 bg-white text-slate-600 flex-col fixed inset-y-0 border-r border-slate-200/80 shadow-sm z-30">
      <div className="h-24 flex items-center justify-center px-6 border-b border-slate-100">
        <Link
          href="/"
          className="transition-opacity hover:opacity-90 flex items-center justify-center"
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={160}
            height={80}
            className="h-20 w-auto object-contain max-h-20"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
          {lang === "ja" ? "メインメニュー" : "MAIN MENU"}
        </p>

        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
            isActive("/")
              ? "bg-slate-100 text-[#1f497c] font-bold"
              : "text-slate-600 hover:text-[#1f497c] hover:bg-slate-100"
          }`}
        >
          <Gamepad2
            className={`w-5 h-5 ${isActive("/") ? "text-[#1f497c]" : "text-slate-400 group-hover:text-[#1f497c]"}`}
          />
          <span className="text-sm tracking-tight">
            {lang === "ja" ? "ゲーセン" : "Arcade"}
          </span>
        </Link>

        <Link
          href="/leaderboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
            isActive("/leaderboard")
              ? "bg-slate-100 text-[#1f497c] font-bold"
              : "text-slate-600 hover:text-[#1f497c] hover:bg-slate-100"
          }`}
        >
          <Trophy
            className={`w-5 h-5 ${isActive("/leaderboard") ? "text-[#1f497c]" : "text-slate-400 group-hover:text-[#1f497c]"}`}
          />
          <span className="text-sm tracking-tight">
            {lang === "ja" ? "ハウスカップ" : "House Cup"}
          </span>
        </Link>

        <div className="pt-4 mt-4 border-t border-slate-100">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            {lang === "ja" ? "コミュニティ" : "COMMUNITY"}
          </p>
        </div>

        <Link
          href="/discussion"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
            isActive("/discussion")
              ? "bg-slate-100 text-[#1f497c] font-bold"
              : "text-slate-600 hover:text-[#1f497c] hover:bg-slate-100"
          }`}
        >
          <div className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
              <g className="flower-petal">
                <circle cx="50" cy="22" r="16" />
                <circle cx="50" cy="78" r="16" />
                <circle cx="22" cy="50" r="16" />
                <circle cx="78" cy="50" r="16" />
                <circle cx="30" cy="30" r="16" />
                <circle cx="70" cy="30" r="16" />
                <circle cx="30" cy="70" r="16" />
                <circle cx="70" cy="70" r="16" />
              </g>
              <circle className="flower-core" cx="50" cy="50" r="16" />
            </svg>
          </div>
          <span className="text-sm tracking-tight">
            {lang === "ja" ? "掲示板" : "Discussion Board"}
          </span>
        </Link>

        <div className="pt-4 mt-4 border-t border-slate-100">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            {lang === "ja" ? "管理者" : "ADMIN"}
          </p>
        </div>

        <Link
          href="/admin/games"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
            isActive("/admin/games")
              ? "bg-slate-100 text-[#1f497c] font-bold"
              : "text-slate-600 hover:text-[#1f497c] hover:bg-slate-100"
          }`}
        >
          <UploadCloud
            className={`w-5 h-5 ${isActive("/admin/games") ? "text-[#1f497c]" : "text-slate-400 group-hover:text-[#1f497c]"}`}
          />
          <span className="text-sm tracking-tight">
            {lang === "ja" ? "ゲーム管理" : "Manage Games"}
          </span>
        </Link>
      </nav>

      {nickname && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 backdrop-blur-sm">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-sm text-red-600 font-semibold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === "ja" ? "ログアウト" : "Logout"}</span>
          </button>
        </div>
      )}
    </aside>
  );
}
