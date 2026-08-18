import React, { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";

/**
 * SplashScreen — Modern Dark + Neon Glow
 * Har baar app open hone par dikhta hai.
 */
export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState("enter"); // enter → hold → exit

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 400);
    const exitTimer = setTimeout(() => setPhase("exit"), 2200);
    const doneTimer = setTimeout(() => onFinish?.(), 2700);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  const isEnter = phase === "enter";
  const isExit  = phase === "exit";
  const isHold  = phase === "hold";

  /* Random particle positions (stable — generated once) */
  const particles = [
    { x: 12, y: 20, s: 2,   d: 3.1 },
    { x: 85, y: 15, s: 1.5, d: 2.3 },
    { x: 70, y: 75, s: 2.5, d: 4.0 },
    { x: 25, y: 80, s: 1.8, d: 3.5 },
    { x: 90, y: 55, s: 1.2, d: 2.8 },
    { x: 5,  y: 50, s: 2,   d: 3.8 },
    { x: 50, y: 10, s: 1.5, d: 2.5 },
    { x: 60, y: 90, s: 2,   d: 3.2 },
    { x: 40, y: 65, s: 1,   d: 4.5 },
    { x: 78, y: 38, s: 1.8, d: 2.1 },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        opacity: isExit ? 0 : 1,
        transition: "opacity 0.55s cubic-bezier(0.4,0,1,1)",
        pointerEvents: isExit ? "none" : "all",
        overflow: "hidden",
      }}
    >
      {/* ── Floating particles ── */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top:  `${p.y}%`,
            width:  p.s,
            height: p.s,
            borderRadius: "50%",
            background: i % 2 === 0 ? "#00d4ff" : "#7c3aed",
            boxShadow: i % 2 === 0
              ? `0 0 ${p.s * 4}px #00d4ff`
              : `0 0 ${p.s * 4}px #7c3aed`,
            animation: `neonFloat ${p.d}s ease-in-out infinite alternate`,
            opacity: 0.7,
          }}
        />
      ))}

      {/* ── Neon grid lines (subtle) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Outer glow ring ── */}
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: "1px solid rgba(0,212,255,0.12)",
          boxShadow: "0 0 80px rgba(0,212,255,0.08) inset",
          animation: "neonRingOuter 4s linear infinite",
        }}
      />
      {/* ── Middle ring ── */}
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: "50%",
          border: "1px solid rgba(124,58,237,0.2)",
          animation: "neonRingMiddle 3s linear infinite reverse",
        }}
      />

      {/* ── Spinning arc ── */}
      <div
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "#00d4ff",
          borderRightColor: "rgba(0,212,255,0.3)",
          boxShadow: "0 0 20px rgba(0,212,255,0.5)",
          animation: "neonSpin 1.2s linear infinite",
          opacity: isHold ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* ── Center content ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          position: "relative",
          zIndex: 2,
          transform: isEnter ? "scale(0.8)" : "scale(1)",
          opacity: isEnter ? 0 : 1,
          transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.45s ease",
        }}
      >
        {/* Logo icon — same as TopNav/BrandMark */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "26px",
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isHold
              ? "0 0 50px rgba(59,130,246,0.4), 0 0 100px rgba(249,115,22,0.15), inset 0 0 20px rgba(255,255,255,0.02)"
              : "0 0 20px rgba(59,130,246,0.15), inset 0 0 10px rgba(255,255,255,0.01)",
            transition: "box-shadow 0.6s ease",
            position: "relative",
          }}
        >
          {/* Oversized BrandMark — same M/ as everywhere */}
          <span
            style={{
              fontSize: "3.2rem",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#3b82f6" }}>M</span>
            <span style={{ color: "#f97316", marginLeft: "-4px" }}>/</span>
          </span>
        </div>

        {/* Brand text */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "2.6rem",
              fontWeight: 900,
              letterSpacing: "0.25em",
              margin: 0,
              fontFamily: "'Inter', sans-serif",
              textTransform: "uppercase",
              color: "#fff",
              textShadow: isHold
                ? "0 0 25px rgba(255,255,255,0.4), 0 0 50px rgba(59,130,246,0.3)"
                : "none",
              transition: "text-shadow 0.6s ease",
            }}
          >
            MERSKO
          </h1>
          <div
            style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, #00d4ff, transparent)",
              margin: "10px 0",
              opacity: isHold ? 0.7 : 0,
              transition: "opacity 0.5s ease 0.2s",
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "0.7rem",
              letterSpacing: "0.4em",
              color: "rgba(0,212,255,0.6)",
              textTransform: "uppercase",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              opacity: isHold ? 1 : 0,
              transition: "opacity 0.5s ease 0.3s",
            }}
          >
            Your Online Store
          </p>
        </div>

        {/* ── Loading indicator ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            marginTop: 8,
            opacity: isHold ? 1 : 0,
            transition: "opacity 0.4s ease 0.2s",
          }}
        >
          {/* 3 staggered pulse dots */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: i === 1 ? 10 : 7,
                  height: i === 1 ? 10 : 7,
                  borderRadius: "50%",
                  background:
                    i === 0
                      ? "#3b82f6"
                      : i === 1
                      ? "#ffffff"
                      : "#f97316",
                  boxShadow:
                    i === 0
                      ? "0 0 10px rgba(59,130,246,0.8)"
                      : i === 1
                      ? "0 0 14px rgba(255,255,255,0.6)"
                      : "0 0 10px rgba(249,115,22,0.8)",
                  animation: `dotPulse 1.4s ease-in-out ${i * 0.22}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Smooth fill progress bar */}
          <div
            style={{
              width: 140,
              height: 3,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 99,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Glowing track fill */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 99,
                background: "linear-gradient(90deg, #3b82f6, #f97316)",
                boxShadow: "0 0 10px rgba(59,130,246,0.6)",
                animation: "barFill 2s cubic-bezier(0.4,0,0.2,1) infinite",
                transformOrigin: "left center",
              }}
            />
            {/* Shimmer overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 99,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                animation: "barShimmer 2s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom version tag ── */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          opacity: isHold ? 0.35 : 0,
          transition: "opacity 0.5s ease 0.4s",
          fontSize: "0.65rem",
          color: "#00d4ff",
          letterSpacing: "0.2em",
          fontFamily: "'Inter', sans-serif",
          textTransform: "uppercase",
        }}
      >
        Fast Delivery &nbsp;·&nbsp; Best Prices &nbsp;·&nbsp; Local Products
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes neonFloat {
          from { transform: translateY(0px) scale(1);   opacity: 0.6; }
          to   { transform: translateY(-14px) scale(1.3); opacity: 1;   }
        }
        @keyframes neonRingOuter {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes neonRingMiddle {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes neonSpin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        /* Staggered dot pulse */
        @keyframes dotPulse {
          0%, 100% { transform: translateY(0)   scale(0.85); opacity: 0.45; }
          45%       { transform: translateY(-7px) scale(1.15); opacity: 1;    }
        }
        /* Bar grows from 0 → 100% then snaps back */
        @keyframes barFill {
          0%   { transform: scaleX(0);    opacity: 0.9; }
          70%  { transform: scaleX(1);    opacity: 1;   }
          85%  { transform: scaleX(1);    opacity: 0.6; }
          100% { transform: scaleX(0);    opacity: 0;   }
        }
        /* Shimmer sweeps across the bar */
        @keyframes barShimmer {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(250%);  }
          100% { transform: translateX(250%);  }
        }
      `}</style>
    </div>
  );
}

