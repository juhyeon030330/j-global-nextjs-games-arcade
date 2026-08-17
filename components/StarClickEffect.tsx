"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface StarParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
}

interface PointPopup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  glowColor: string;
}

const STAR_COLORS = ["#fbbf24", "#38bdf8", "#f472b6", "#a7f3d0", "#c084fc"];

const NEON_PRESETS = [
  { color: "#ffd1dc", glowColor: "#38bdf8" }, // Light cherry blossom pink fill
];

export function StarClickEffect() {
  const [particles, setParticles] = useState<StarParticle[]>([]);
  const [popups, setPopups] = useState<PointPopup[]>([]);
  const [isDebug, setIsDebug] = useState(false);
  const isDebugRef = useRef(isDebug);

  useEffect(() => {
    isDebugRef.current = isDebug;
  }, [isDebug]);

  const adjustPoints = async (delta: number) => {
    const nickname = localStorage.getItem("nickname");
    if (!nickname) return;

    const { data: lbUser } = await supabase
      .from("leaderboard")
      .select("score")
      .eq("nickname", nickname)
      .single();

    const currentScore = lbUser?.score || 0;
    const newScore = Math.max(0, currentScore + delta);

    await supabase
      .from("leaderboard")
      .update({ score: newScore })
      .eq("nickname", nickname);
  };

  const triggerPopup = (
    x: number,
    y: number,
    text: string,
    presetIndex?: number,
  ) => {
    const popupId = Date.now() + Math.random();
    const preset =
      presetIndex !== undefined
        ? NEON_PRESETS[presetIndex]
        : NEON_PRESETS[Math.floor(Math.random() * NEON_PRESETS.length)];

    const popup = {
      id: popupId,
      x,
      y,
      text,
      color: preset.color,
      glowColor: preset.glowColor,
    };

    setPopups((prev) => [...prev, popup]);

    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 1200);
  };

  // 1. Key listeners and URL Params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "true") {
      setIsDebug(true);
    }

    const handleKeyDown = async (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.shiftKey && (e.key === "P" || e.key === "p")) {
        setIsDebug((prev) => !prev);
      }

      if (e.key === "=" || e.key === "+") {
        await adjustPoints(10);
        triggerPopup(
          window.innerWidth / 2,
          window.innerHeight / 2,
          "Lucky !!!\n+10 PTS!",
          0,
        );
      }

      if (e.key === "-" || e.key === "_") {
        await adjustPoints(-10);
        triggerPopup(
          window.innerWidth / 2,
          window.innerHeight / 2,
          "Unlucky...\n-10 PTS!",
          0,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. Mouse Click Handler
  useEffect(() => {
    let nextId = 0;

    const handleClick = async (e: MouseEvent) => {
      const particleCount = 8;
      const newParticles: StarParticle[] = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: nextId++,
          x: e.clientX,
          y: e.clientY,
          angle:
            (Math.PI * 2 * i) / particleCount + (Math.random() * 0.4 - 0.2),
          speed: Math.random() * 60 + 60,
          size: Math.random() * 20 + 20,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);

      setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !newParticles.some((np) => np.id === p.id)),
        );
      }, 2200);

      const roll = Math.random();

      if (isDebugRef.current || roll < 0.01) {
        // 1% chance (0.00 to 0.01)
        await adjustPoints(10);
        triggerPopup(e.clientX, e.clientY, "Lucky !!!\n+10 PTS!");
      } else if (roll < 0.02) {
        // 1% chance (0.01 to 0.02)
        await adjustPoints(-10);
        triggerPopup(e.clientX, e.clientY, "Unlucky...\n-10 PTS!");
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* Debug Banner */}
      {isDebug && (
        <div className="absolute top-3 left-3 bg-rose-600 text-white font-mono text-xs px-2.5 py-1 rounded-md shadow-lg font-bold z-[10000]">
          DEBUG MODE (100% Win Rate) | Key '=' (+10) | Key '-' (-10)
        </div>
      )}

      {/* Star Particles */}
      {particles.map((p) => {
        const dx = Math.cos(p.angle) * p.speed;
        const dy = Math.sin(p.angle) * p.speed;

        return (
          <span
            key={p.id}
            style={
              {
                left: `${p.x}px`,
                top: `${p.y}px`,
                fontSize: `${p.size}px`,
                color: p.color,
                "--dx": `${dx}px`,
                "--dy": `${dy}px`,
              } as React.CSSProperties
            }
            className="absolute animate-star-burst leading-none inline-block"
          >
            ★
          </span>
        );
      })}

      {/* Floating Popups */}
      {popups.map((popup) => (
        <div
          key={popup.id}
          style={{
            left: `${popup.x}px`,
            top: `${popup.y}px`,
            color: popup.color,
            filter: `
              drop-shadow(1.5px 0 0 #38bdf8)
              drop-shadow(-1.5px 0 0 #38bdf8)
              drop-shadow(0 1.5px 0 #38bdf8)
              drop-shadow(0 -1.5px 0 #38bdf8)
            `,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 font-black text-3xl tracking-wider animate-bounce text-center whitespace-pre-line"
        >
          {popup.text}
        </div>
      ))}
    </div>
  );
}
