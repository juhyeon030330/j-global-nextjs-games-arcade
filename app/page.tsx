"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ArcadeRow, Game } from "@/components/ArcadeRow";

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [nickname, setNickname] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchGames() {
      const { data } = await supabase.from("games").select("*");
      if (data) setGames(data);
    }
    fetchGames();

    // Load persisted nickname or language if available
    const savedLang = localStorage.getItem("lang") as "ja" | "en";
    if (savedLang) setLang(savedLang);

    const savedNickname = localStorage.getItem("nickname");
    if (savedNickname) setNickname(savedNickname);
  }, []);

  const toggleLang = () => {
    const nextLang = lang === "ja" ? "en" : "ja";
    setLang(nextLang);
    localStorage.setItem("lang", nextLang);
  };

  const handleLogout = () => {
    setNickname(undefined);
    localStorage.removeItem("nickname");
  };

  const popularGames = [...games].sort(
    (a, b) => (b.clicks || 0) - (a.clicks || 0),
  );
  const alphabeticalGames = [...games].sort((a, b) =>
    (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase()),
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar lang={lang} nickname={nickname} onLogout={handleLogout} />

      <div className="flex-1 ml-0 md:ml-64 flex flex-col min-w-0 pb-20 md:pb-0 bg-gradient-to-b from-slate-50 to-white">
        <Header
          lang={lang}
          toggleLang={toggleLang}
          nickname={nickname}
          breadcrumbs={
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md font-bold">
                {lang === "ja" ? "ゲーセン" : "Arcade"}
              </span>
            </>
          }
        />

        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto flex-1 focus:outline-none">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {lang === "ja"
                ? "J-Global ゲームセンター"
                : "Japanese Game Arcade"}
            </h1>
            <p className="text-sm text-slate-500">
              {lang === "ja"
                ? "以下のゲームを選択して日本語を練習し、アーケードスコアを獲得しましょう！"
                : "Select a game below to practice Japanese and build your arcade score!"}
            </p>
          </div>

          <ArcadeRow
            title={lang === "ja" ? "注目のゲーム" : "Featured Games"}
            games={games}
            lang={lang}
          />
          <ArcadeRow
            title={lang === "ja" ? "人気のゲーム" : "Popular Choices"}
            games={popularGames}
            lang={lang}
          />
          <ArcadeRow
            title={lang === "ja" ? "すべてのゲーム (A-Z)" : "All Games (A-Z)"}
            games={alphabeticalGames}
            lang={lang}
          />
        </main>
      </div>
    </div>
  );
}
