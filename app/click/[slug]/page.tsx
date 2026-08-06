"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

const HOUSES = ["A", "B", "C", "D"];

export default function ClickGamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function processClick() {
      const { data: game } = await supabase
        .from("games")
        .select("*")
        .eq("slug", slug)
        .single();

      if (game) {
        await supabase
          .from("games")
          .update({ clicks: (game.clicks || 0) + 1 })
          .eq("slug", slug);

        const nickname = localStorage.getItem("nickname");
        let userHouse = localStorage.getItem("house");

        if (nickname) {
          const { data: lbUser } = await supabase
            .from("leaderboard")
            .select("*")
            .eq("nickname", nickname)
            .single();

          if (lbUser?.house) {
            userHouse = lbUser.house;
            localStorage.setItem("house", lbUser.house);
          } else if (!userHouse) {
            userHouse = HOUSES[Math.floor(Math.random() * HOUSES.length)];
            localStorage.setItem("house", userHouse);
          }

          if (lbUser) {
            await supabase
              .from("leaderboard")
              .update({
                score: (lbUser.score || 0) + 1,
                house: userHouse,
              })
              .eq("nickname", nickname);
          } else {
            await supabase.from("leaderboard").insert({
              nickname,
              score: 1,
              house: userHouse,
            });
          }
        }
      }
      setLoading(false);
    }

    processClick();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500 font-semibold text-sm">
        Loading game...
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-900">
      <iframe
        src={`/api/game-proxy/${slug}`}
        className="w-full h-full border-none"
        allow="autoplay; payment; fullscreen; microphone; camera; geolocation"
      />
    </div>
  );
}
