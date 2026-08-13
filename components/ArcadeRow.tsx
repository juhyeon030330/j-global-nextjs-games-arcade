"use client";

import { useEffect, useRef, useState, MouseEvent } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import {
  getSavedGames,
  toggleSavedGame,
  SAVED_GAMES_EVENT,
} from "@/lib/savedGames";

export interface Game {
  slug: string;
  name: string;
  name_ja?: string;
  description?: string;
  description_ja?: string;
  clicks: number;
  code?: string;
}

interface ArcadeRowProps {
  title: string;
  games: Game[];
  lang: "ja" | "en";
  nickname?: string;
}

export function ArcadeRow({ title, games, lang, nickname }: ArcadeRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setSavedSlugs(getSavedGames());
    refresh();
    window.addEventListener(SAVED_GAMES_EVENT, refresh);
    return () => window.removeEventListener(SAVED_GAMES_EVENT, refresh);
  }, []);

  const handleToggleSave = (e: MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedSlugs(toggleSavedGame(slug));
  };

  if (!games || games.length === 0) return null;

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !rowRef.current) return;
    isDown.current = true;
    hasDragged.current = false;
    rowRef.current.style.scrollBehavior = "auto";
    startX.current = e.pageX - rowRef.current.offsetLeft;
    scrollLeft.current = rowRef.current.scrollLeft;
  };

  const handleMouseLeaveOrUp = () => {
    if (!isDown.current || !rowRef.current) return;
    isDown.current = false;
    rowRef.current.style.scrollBehavior = "smooth";
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDown.current || !rowRef.current) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) hasDragged.current = true;
    rowRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleCardClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (hasDragged.current) {
      e.preventDefault();
      hasDragged.current = false;
    }
  };

  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-[#1f497c] pl-3 flex items-center gap-2">
        <span>{title}</span>
      </h2>
      <div
        ref={rowRef}
        className="netflix-row"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
      >
        {games.map((game) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            onClick={handleCardClick}
            className="card flex-none w-[270px] bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-[#1f497c] transition-all group flex flex-col"
          >
            <div className="h-[145px] w-full bg-slate-100 relative overflow-hidden">
              <div className="absolute inset-0 z-10" />
              <iframe
                src={`/api/game-proxy/${game.slug}`}
                className="live-preview"
                loading="lazy"
              />
              {nickname && (
                <button
                  onClick={(e) => handleToggleSave(e, game.slug)}
                  className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm cursor-pointer transition-colors"
                  aria-label={
                    savedSlugs.includes(game.slug) ? "Unsave" : "Save"
                  }
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-colors ${
                      savedSlugs.includes(game.slug)
                        ? "fill-rose-500 text-rose-500"
                        : "text-slate-400"
                    }`}
                  />
                </button>
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-slate-900 group-hover:text-[#1f497c] transition-colors mb-1 text-base line-clamp-1">
                {(lang === "ja" ? game.name_ja : game.name) || game.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
                {(lang === "ja" ? game.description_ja : game.description) ||
                  game.description}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs mt-auto">
                <span className="bg-sky-50 text-[#1f497c] font-bold px-2.5 py-1 rounded-lg">
                  {lang === "ja" ? "クリック数" : "Clicks"}: {game.clicks}
                </span>
                <span className="text-slate-400 font-semibold">
                  {game.code || ""}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
