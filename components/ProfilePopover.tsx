"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSavedGames, toggleSavedGame, SAVED_GAMES_EVENT } from "@/lib/savedGames";

interface SavedGame {
  slug: string;
  name: string;
  name_ja?: string;
}

interface ProfilePopoverProps {
  lang: "ja" | "en";
  nickname: string;
  onClose: () => void;
}

export function ProfilePopover({ lang, nickname, onClose }: ProfilePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [house, setHouse] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from("leaderboard")
        .select("house, score")
        .eq("nickname", nickname)
        .single();
      if (data) {
        setHouse(data.house || "");
        setScore(data.score || 0);
      }
    }
    loadProfile();
  }, [nickname]);

  useEffect(() => {
    async function loadSavedGames() {
      const slugs = getSavedGames();
      if (slugs.length === 0) {
        setSavedGames([]);
        return;
      }
      const { data } = await supabase
        .from("games")
        .select("slug, name, name_ja")
        .in("slug", slugs);
      if (data) setSavedGames(data);
    }
    loadSavedGames();

    window.addEventListener(SAVED_GAMES_EVENT, loadSavedGames);
    return () => window.removeEventListener(SAVED_GAMES_EVENT, loadSavedGames);
  }, []);

  const handleRemove = (slug: string) => {
    toggleSavedGame(slug);
    setSavedGames((prev) => prev.filter((g) => g.slug !== slug));
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 overflow-hidden"
    >
      <div className="p-4 bg-gradient-to-br from-sky-50 to-white border-b border-slate-100 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full border-2 border-slate-200 bg-cover bg-center shrink-0"
          style={{
            backgroundImage: `url('/static/images/house_${(house || "A").toLowerCase()}.webp')`,
          }}
        />
        <div className="min-w-0">
          <div className="font-extrabold text-slate-900 text-sm truncate">
            {nickname}
          </div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">
            {lang === "ja" ? "ポイント" : "Points"}:{" "}
            <span className="text-[#1f497c] font-bold">{score}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          {lang === "ja" ? "保存したゲーム" : "Saved Games"}
        </h4>

        {savedGames.length === 0 ? (
          <p className="text-xs text-slate-400">
            {lang === "ja"
              ? "まだ保存したゲームがありません"
              : "No saved games yet"}
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-56 overflow-y-auto">
            {savedGames.map((g) => (
              <li
                key={g.slug}
                className="flex items-center justify-between gap-2 group"
              >
                <Link
                  href={`/games/${g.slug}`}
                  onClick={onClose}
                  className="text-sm font-semibold text-slate-700 hover:text-[#1f497c] truncate"
                >
                  {(lang === "ja" ? g.name_ja : g.name) || g.name}
                </Link>
                <button
                  onClick={() => handleRemove(g.slug)}
                  className="text-slate-300 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                  aria-label="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
