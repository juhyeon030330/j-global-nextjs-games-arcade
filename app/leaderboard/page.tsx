"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { BeadStage } from "@/components/BeadStage";

interface Player {
  nickname: string;
  house: string;
  score: number;
  updated_at?: string;
}

const HOUSES = ["A", "B", "C", "D"];

const HOUSE_META = [
  { code: "A", name_ja: "化け傘", name_en: "Bake-kasa (Paper Umbrella)" },
  { code: "B", name_ja: "鬼火", name_en: "Onibi (Demon Fire)" },
  { code: "C", name_ja: "神龍", name_en: "Shinryu (Divine Dragon)" },
  { code: "D", name_ja: "化け草履", name_en: "Bake-zori (Straw Sandal)" },
];

export default function LeaderboardPage() {
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [nickname, setNickname] = useState<string>("");
  const [inputNickname, setInputNickname] = useState<string>("");
  const [userHouse, setUserHouse] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "ja" | "en";
    if (savedLang) setLang(savedLang);

    const savedName = localStorage.getItem("nickname") || "";
    setNickname(savedName);

    async function loadLeaderboard() {
      const { data } = await supabase
        .from("leaderboard")
        .select("nickname, house, score, updated_at");
      if (data) {
        setPlayers(data);
        if (savedName) {
          const userRec = data.find((p) => p.nickname === savedName);
          if (userRec?.house) {
            setUserHouse(userRec.house);
            localStorage.setItem("house", userRec.house);
          } else {
            const fallbackHouse =
              localStorage.getItem("house") ||
              HOUSES[Math.floor(Math.random() * HOUSES.length)];
            setUserHouse(fallbackHouse);
            localStorage.setItem("house", fallbackHouse);
          }
        }
      }
    }
    loadLeaderboard();
  }, []);

  const handleSetNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNickname.trim()) return;
    const name = inputNickname.trim().slice(0, 20);
    localStorage.setItem("nickname", name);
    setNickname(name);

    const { data } = await supabase
      .from("leaderboard")
      .select("house")
      .eq("nickname", name)
      .single();

    if (data?.house) {
      setUserHouse(data.house);
      localStorage.setItem("house", data.house);
    } else {
      const assignedHouse = HOUSES[Math.floor(Math.random() * HOUSES.length)];
      setUserHouse(assignedHouse);
      localStorage.setItem("house", assignedHouse);
    }
  };

  const houseTotals: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let userScore = 0;

  players.forEach((p) => {
    if (p.house in houseTotals) {
      houseTotals[p.house] += p.score || 0;
    }
    if (nickname && p.nickname === nickname) {
      userScore = p.score || 0;
    }
  });

  const maxScore = Math.max(...Object.values(houseTotals), 1);

  const rankedPlayers = [...players].sort(
    (a, b) => (b.score || 0) - (a.score || 0),
  );

  const RANK_BADGE_STYLES: Record<number, string> = {
    1: "bg-amber-400 text-white",
    2: "bg-slate-300 text-slate-700",
    3: "bg-amber-700 text-white",
  };

  const formatUpdatedAt = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString(lang === "ja" ? "ja-JP" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar
        lang={lang}
        nickname={nickname}
        onLogout={() => setNickname("")}
      />

      <div className="flex-1 ml-0 md:ml-64 flex flex-col min-w-0 pb-20 md:pb-0 bg-gradient-to-b from-slate-50 to-white">
        <Header
          lang={lang}
          toggleLang={() => setLang(lang === "ja" ? "en" : "ja")}
          nickname={nickname}
          breadcrumbs={
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md font-bold">
                {lang === "ja" ? "ハウスカップ" : "House Cup"}
              </span>
            </>
          }
        />

        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1">
          <div className="mb-4 text-center">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              {lang === "ja"
                ? "ゲームをプレイしてビーズを大きくしよう！"
                : "Play games to grow your bead"}
            </h1>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl mb-8 max-w-lg mx-auto p-5 text-center shadow-xs">
            {nickname ? (
              <div className="space-y-1.5 text-slate-800">
                <div className="text-base md:text-lg font-extrabold">
                  <span className="text-[#1f497c]">{nickname}</span>:{" "}
                  <span className="text-amber-600">
                    {lang === "ja" ? "ハウス" : "House"} {userHouse || "A"}
                  </span>
                </div>
                <div className="text-xs md:text-sm font-medium text-slate-600 flex items-center justify-center gap-3">
                  <span>
                    {lang === "ja" ? "ユーザーポイント" : "User Points"}:{" "}
                    <strong>{userScore}</strong>
                  </span>
                  <span>|</span>
                  <span>
                    {lang === "ja" ? "ハウスポイント" : "House Points"}:{" "}
                    <strong>{houseTotals[userHouse] || 0}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSetNickname}
                className="flex items-center justify-center gap-3 flex-wrap"
              >
                <label className="font-bold text-slate-700 text-sm">
                  {lang === "ja"
                    ? "ニックネームの登録:"
                    : "Claim an Arcade Nickname:"}
                </label>
                <input
                  type="text"
                  value={inputNickname}
                  onChange={(e) => setInputNickname(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-48 bg-white"
                  maxLength={20}
                  required
                />
                <button
                  type="submit"
                  className="bg-[#1f497c] text-white font-bold px-4 py-1.5 rounded-lg text-sm cursor-pointer"
                >
                  {lang === "ja" ? "参加する" : "Join Board"}
                </button>
              </form>
            )}
          </div>

          <BeadStage players={players} currentUser={nickname} />

          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-10">
            <h2 className="text-center font-bold text-slate-800 text-lg mb-8">
              {lang === "ja" ? "ハウス合計ポイント" : "House Point Totals"}
            </h2>
            <div className="grid grid-cols-4 gap-4 md:gap-8 items-end">
              {HOUSE_META.map((item) => {
                const score = houseTotals[item.code];
                const pct = Math.round((score / maxScore) * 100);
                return (
                  <div
                    key={item.code}
                    className="flex flex-col items-center w-full"
                  >
                    <span className="text-xs md:text-sm font-extrabold text-slate-700 mb-2">
                      {score}{" "}
                      <span className="text-[10px] text-slate-400">PTS</span>
                    </span>
                    <div className="w-12 md:w-16 h-64 bg-slate-100 rounded-md flex items-end overflow-hidden border border-slate-200/80 mb-6">
                      <div
                        className="w-full bg-[#1f497c] transition-all duration-700"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <div
                      className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-slate-200/80 overflow-hidden shadow-md bg-cover bg-center"
                      style={{
                        backgroundImage: `url('/static/images/house_${item.code.toLowerCase()}.webp')`,
                      }}
                    />
                    <div className="mt-4 text-center">
                      <div className="font-extrabold text-slate-900 text-sm md:text-base leading-tight">
                        {item.name_ja}
                      </div>
                      <div className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">
                        {item.name_en}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-10 mt-8">
            <h2 className="text-center font-bold text-slate-800 text-lg mb-6">
              {lang === "ja" ? "ランキング" : "Ranking"}
            </h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2 px-2 font-bold w-16">
                    {lang === "ja" ? "順位" : "Rank"}
                  </th>
                  <th className="py-2 px-2 font-bold">
                    {lang === "ja" ? "プレイヤー" : "Player"}
                  </th>
                  <th className="py-2 px-2 font-bold text-right">
                    {lang === "ja" ? "ポイント" : "Points"}
                  </th>
                  <th className="py-2 px-2 font-bold text-right">
                    {lang === "ja" ? "最終更新" : "Last Updated"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankedPlayers.map((p, i) => {
                  const rank = i + 1;
                  return (
                    <tr key={p.nickname}>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            RANK_BADGE_STYLES[rank] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full border border-slate-200 bg-cover bg-center shrink-0"
                            style={{
                              backgroundImage: `url('/static/images/house_${(p.house || "A").toLowerCase()}.webp')`,
                            }}
                          />
                          <span className="font-bold text-slate-800">
                            {p.nickname}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-extrabold text-[#1f497c]">
                        {p.score || 0}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">
                          PTS
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-xs text-slate-500">
                        {formatUpdatedAt(p.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
