"use client";

import { useEffect, useRef, useState } from "react";

interface Player {
  nickname: string;
  house: string;
  score: number;
}

interface BeadStageProps {
  players: Player[];
  currentUser: string;
}

const HOUSE_BORDER_COLORS: Record<string, string> = {
  A: "#ef4444",
  B: "#3b82f6",
  C: "#10b981",
  D: "#f59e0b",
};

export function BeadStage({ players, currentUser }: BeadStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const houseImages: Record<string, HTMLImageElement> = {
      A: new Image(),
      B: new Image(),
      C: new Image(),
      D: new Image(),
    };

    houseImages.A.src = "/static/images/house_a.webp";
    houseImages.B.src = "/static/images/house_b.webp";
    houseImages.C.src = "/static/images/house_c.webp";
    houseImages.D.src = "/static/images/house_d.webp";

    class UserBead {
      nickname: string;
      house: string;
      score: number;
      radius: number;
      x: number;
      y: number;
      vx: number;
      vy: number;

      constructor(nickname: string, house: string, score: number) {
        this.nickname = nickname;
        this.house = house in houseImages ? house : "A";
        this.score = score || 0;
        this.radius = Math.min(22 + Math.sqrt(this.score) * 5, 60);
        this.x =
          Math.random() * (canvas!.width - this.radius * 4) + this.radius * 2;
        this.y =
          Math.random() * (canvas!.height - this.radius * 4) + this.radius * 2;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x - this.radius <= 0 || this.x + this.radius >= canvas!.width)
          this.vx *= -1;
        if (this.y - this.radius <= 0 || this.y + this.radius >= canvas!.height)
          this.vy *= -1;
      }

      draw() {
        const img = houseImages[this.house];
        ctx!.save();

        if (this.nickname === currentUser) {
          ctx!.beginPath();
          ctx!.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
          ctx!.fillStyle = "rgba(251, 191, 36, 0.4)";
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.clip();

        if (img.complete && img.naturalWidth !== 0) {
          ctx!.drawImage(
            img,
            this.x - this.radius,
            this.y - this.radius,
            this.radius * 2,
            this.radius * 2,
          );
        } else {
          ctx!.fillStyle = HOUSE_BORDER_COLORS[this.house] || "#334155";
          ctx!.fill();
        }

        ctx!.restore();

        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.lineWidth = 3;
        ctx!.strokeStyle = HOUSE_BORDER_COLORS[this.house] || "#ffffff";
        ctx!.stroke();
      }
    }

    const beads = players.map(
      (p) => new UserBead(p.nickname, p.house, p.score),
    );

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      beads.forEach((bead) => {
        bead.update();
        bead.draw();
      });

      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let hoveredBead = null;
      for (let bead of beads) {
        const dist = Math.hypot(mouseX - bead.x, mouseY - bead.y);
        if (dist <= bead.radius) {
          hoveredBead = bead;
          break;
        }
      }

      if (hoveredBead) {
        setTooltip({
          text: `${hoveredBead.nickname}: ${hoveredBead.score} pts`,
          x: mouseX + 12,
          y: mouseY + 12,
        });
      } else {
        setTooltip(null);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [players, currentUser]);

  return (
    <div className="relative w-full h-[500px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-950 mb-12">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 cursor-pointer"
      />

      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <strong>{tooltip.text}</strong>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>LIVE PLAYERS</span>
      </div>
    </div>
  );
}
