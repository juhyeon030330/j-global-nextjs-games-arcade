"use client";

import { useEffect, useState } from "react";

interface StarParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
}

const STAR_COLORS = ["#fbbf24", "#38bdf8", "#f472b6", "#a7f3d0", "#c084fc"];

export function StarClickEffect() {
  const [particles, setParticles] = useState<StarParticle[]>([]);

  useEffect(() => {
    let nextId = 0;

    const handleClick = (e: MouseEvent) => {
      const particleCount = 8;
      const newParticles: StarParticle[] = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: nextId++,
          x: e.clientX,
          y: e.clientY,
          angle:
            (Math.PI * 2 * i) / particleCount + (Math.random() * 0.4 - 0.2),
          speed: Math.random() * 80 + 40, // Doubled speed / burst distance
          size: Math.random() * 20 + 20, // Doubled star size (20px - 40px)
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);

      // Doubled cleanup time to match 1.2s animation
      setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !newParticles.some((np) => np.id === p.id)),
        );
      }, 1200);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
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
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-star-burst select-none"
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
