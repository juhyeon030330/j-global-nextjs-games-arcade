"use client";

import { useEffect, useState, useRef, use } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ShieldCheck, Trophy, Ghost } from "lucide-react";
import Link from "next/link";

const HOUSES = ["A", "B", "C", "D"];
const INTERVAL_SECONDS = 60; // Reward every 60s
const POINTS_PER_INTERVAL = 5;
const IDLE_THRESHOLD_SECONDS = 15; // Inactivity seconds before 1st ghost appears (Updated from 5s)

const GHOST_COLORS = [
  "text-sky-300 drop-shadow-[0_0_20px_rgba(56,189,248,0.85)]",
  "text-purple-300 drop-shadow-[0_0_20px_rgba(192,132,252,0.85)]",
  "text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.85)]",
  "text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.85)]",
  "text-rose-300 drop-shadow-[0_0_20px_rgba(251,113,133,0.85)]",
  "text-indigo-300 drop-shadow-[0_0_20px_rgba(129,140,248,0.85)]",
];

interface ActiveGhost {
  id: string;
  top: number;
  left: number;
  colorClass: string;
  scaleBase: number;
  speedX: number;
  speedY: number;
  rotSpeed: number;
  createdAt: number;
  fadingOut: boolean;
  isSpawning: boolean;
}

export default function ClickGamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);
  const [gameName, setGameName] = useState("");
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [earnedSessionPoints, setEarnedSessionPoints] = useState(0);
  const [isIdle, setIsIdle] = useState(false);

  const [ghosts, setGhosts] = useState<ActiveGhost[]>([]);
  const [elapsedAnim, setElapsedAnim] = useState(0);

  const activeSecondsRef = useRef(0);
  const lastActivityTimeRef = useRef(Date.now());
  const animFrameRef = useRef<number | null>(null);

  // 1. Initialize Game Session
  useEffect(() => {
    async function initGameSession() {
      // Increment game clicks
      const { data: game } = await supabase
        .from("games")
        .select("*")
        .eq("slug", slug)
        .single();

      if (game) {
        setGameName(game.name_ja || game.name);
        await supabase
          .from("games")
          .update({ clicks: (game.clicks || 0) + 1 })
          .eq("slug", slug);
      }

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

        if (!lbUser) {
          // If user doesn't exist, create them with 1 point for starting the game
          await supabase.from("leaderboard").insert({
            nickname,
            score: 1,
            house: userHouse,
          });
        } else {
          // If user exists, increment their existing score by 1
          await supabase
            .from("leaderboard")
            .update({ score: (lbUser.score || 0) + 1 })
            .eq("nickname", nickname);
        }
      }

      setLoading(false);
    }

    initGameSession();
  }, [slug]);

  // 2. Activity Handler: Triggers fade-out on active ghosts and wipes state cleanly
  const handleUserActivity = () => {
    lastActivityTimeRef.current = Date.now();
    if (isIdle) {
      setIsIdle(false);
      // Mark all current ghosts to fade out
      setGhosts((prev) => prev.map((g) => ({ ...g, fadingOut: true })));

      // Clear the ghosts array after 3s fade out completes
      setTimeout(() => {
        setGhosts([]);
      }, 3000);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
    };
  }, [isIdle]);

  // 3. Continuous Motion Loop
  useEffect(() => {
    let startTime = performance.now();

    const animate = (now: number) => {
      setElapsedAnim((now - startTime) / 1000);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // 4. Timed Engagement & Controlled 1-by-1 Ghost Spawner
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const secondsSinceActivity = (now - lastActivityTimeRef.current) / 1000;

      if (secondsSinceActivity >= IDLE_THRESHOLD_SECONDS) {
        setIsIdle(true);

        setGhosts((prev) => {
          // Remove fully expired ghosts (15s lifespan)
          const validGhosts = prev.filter((g) => now - g.createdAt < 15000);

          // Mark ghosts created >12s ago as fadingOut so they fade over the last 3s
          const updatedGhosts = validGhosts.map((g) => {
            if (!g.fadingOut && now - g.createdAt >= 12000) {
              return { ...g, fadingOut: true };
            }
            return g;
          });

          // Only count non-fading ghosts towards the active quota
          const activeOnly = updatedGhosts.filter((g) => !g.fadingOut);

          // Calculate target count based on idle time
          const targetGhostCount = Math.min(
            15,
            Math.floor(secondsSinceActivity - IDLE_THRESHOLD_SECONDS) + 1,
          );

          // Spawn ONE new ghost if quota isn't met
          if (activeOnly.length < targetGhostCount) {
            const direction = Math.random() < 0.5 ? 1 : -1;
            // Halved rotation speed (formerly 10 to 25 deg/s -> now 5 to 12.5 deg/s)
            const rotSpeed =
              Number((Math.random() * 7.5 + 5).toFixed(2)) * direction;

            const newGhost: ActiveGhost = {
              id: Math.random().toString(36).substring(2, 9),
              top: Math.floor(Math.random() * 85 + 5),
              left: Math.floor(Math.random() * 85 + 5),
              colorClass:
                GHOST_COLORS[Math.floor(Math.random() * GHOST_COLORS.length)],
              scaleBase: Number((Math.random() * 0.6 + 0.8).toFixed(2)),
              // Halved motion speed (formerly 0.2-0.5 -> now 0.1-0.25)
              speedX: Number((Math.random() * 0.15 + 0.1).toFixed(2)),
              speedY: Number((Math.random() * 0.15 + 0.1).toFixed(2)),
              rotSpeed,
              createdAt: now,
              fadingOut: false,
              isSpawning: true,
            };

            return [...updatedGhosts, newGhost];
          }

          return updatedGhosts;
        });
        return;
      }

      if (document.visibilityState === "visible" && !isIdle) {
        activeSecondsRef.current += 1;
        setActiveSeconds(activeSecondsRef.current);

        if (activeSecondsRef.current % INTERVAL_SECONDS === 0) {
          awardEngagementPoints();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isIdle]);

  // 5. Trigger fade-in transition on newly added ghosts
  useEffect(() => {
    if (ghosts.some((g) => g.isSpawning)) {
      const timeout = setTimeout(() => {
        setGhosts((prev) =>
          prev.map((g) => (g.isSpawning ? { ...g, isSpawning: false } : g)),
        );
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [ghosts]);

  const awardEngagementPoints = async () => {
    const nickname = localStorage.getItem("nickname");
    if (!nickname) return;

    const { data: lbUser } = await supabase
      .from("leaderboard")
      .select("score")
      .eq("nickname", nickname)
      .single();

    const currentScore = lbUser?.score || 0;
    const updatedScore = currentScore + POINTS_PER_INTERVAL;

    await supabase
      .from("leaderboard")
      .update({ score: updatedScore })
      .eq("nickname", nickname);

    setEarnedSessionPoints((prev) => prev + POINTS_PER_INTERVAL);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400 font-bold text-sm">
        Loading Arcade Session...
      </div>
    );
  }

  const secondsToNextPoint =
    INTERVAL_SECONDS - (activeSeconds % INTERVAL_SECONDS);

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col overflow-hidden relative select-none">
      {/* Top HUD */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 z-10">
        <Link
          href={`/games/${slug}`}
          className="flex items-center gap-1.5 font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit Game</span>
        </Link>

        <div className="font-extrabold text-white text-sm hidden sm:block">
          {gameName}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Next points in:{" "}
              <strong className="text-sky-400 font-mono">
                {isIdle ? "PAUSED" : `${secondsToNextPoint}s`}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full text-amber-300 font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>+{earnedSessionPoints} PTS Earned</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 w-full bg-black relative overflow-hidden">
        <iframe
          src={`/api/game-proxy/${slug}`}
          className="w-full h-full border-none"
          allow="autoplay; payment; fullscreen; microphone; camera; geolocation"
        />

        {/* Floating Ghosts */}
        {ghosts.map((g) => {
          const x =
            Math.sin(elapsedAnim * g.speedX) * 120 +
            Math.cos(elapsedAnim * 0.2) * 50;
          const y =
            Math.cos(elapsedAnim * g.speedY) * 100 +
            Math.sin(elapsedAnim * 0.15) * 40;
          const rotate = (elapsedAnim * g.rotSpeed) % 360;
          const scale = g.scaleBase + Math.sin(elapsedAnim * 0.8) * 0.12;

          const isHidden = g.isSpawning || g.fadingOut;

          return (
            <div
              key={g.id}
              onMouseMove={handleUserActivity}
              onClick={handleUserActivity}
              style={{ top: `${g.top}%`, left: `${g.left}%` }}
              className={`absolute z-20 cursor-pointer transition-opacity duration-[3000ms] ease-in-out ${
                isHidden
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100 pointer-events-auto"
              }`}
            >
              <div
                style={{
                  transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
                }}
                className="flex items-center justify-center -translate-x-1/2 -translate-y-1/2 will-change-transform"
              >
                <Ghost
                  className={`w-20 h-20 md:w-28 md:h-28 ${g.colorClass}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
