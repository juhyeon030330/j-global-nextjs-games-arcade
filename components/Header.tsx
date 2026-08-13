"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { ProfilePopover } from "@/components/ProfilePopover";

interface HeaderProps {
  lang: "ja" | "en";
  toggleLang: () => void;
  nickname?: string;
  breadcrumbs?: React.ReactNode;
}

export function Header({
  lang,
  toggleLang,
  nickname,
  breadcrumbs,
}: HeaderProps) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>{lang === "ja" ? "ダッシュボード" : "Dashboard"}</span>
        {breadcrumbs}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#1f497c] rounded-xl transition-all border border-slate-200/80 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === "ja" ? "English" : "日本語"}</span>
        </button>

        {nickname && (
          <div className="relative">
            <button
              onClick={() => setShowProfile((prev) => !prev)}
              className="flex items-center gap-2 bg-sky-50 text-[#1f497c] px-3 py-1.5 rounded-full border border-sky-100 hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold">{nickname}</span>
            </button>

            {showProfile && (
              <ProfilePopover
                lang={lang}
                nickname={nickname}
                onClose={() => setShowProfile(false)}
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
}
