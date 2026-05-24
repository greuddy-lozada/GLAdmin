"use client";

import { useRef } from "react";

export function GlareBackground() {
  const refElement = useRef<HTMLDivElement>(null);
  const state = useRef({
    glare: { x: 50, y: 50 },
    background: { x: 50, y: 50 },
  });

  const backgroundStyle = {
    "--step": "5%",
    "--foil-svg": `url("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.99994 3.419C2.99994 3.419 21.6142 7.43646 22.7921 12.153C23.97 16.8695 3.41838 23.0306 3.41838 23.0306' stroke='white' stroke-width='5' stroke-miterlimit='3.86874' stroke-linecap='round' style='mix-blend-mode:darken'/%3E%3C/svg%3E")`,
    "--pattern": "var(--foil-svg) center/100% no-repeat",
    "--rainbow":
      "repeating-linear-gradient( 0deg,rgb(255,119,115) calc(var(--step) * 1),rgba(255,237,95,1) calc(var(--step) * 2),rgba(168,255,95,1) calc(var(--step) * 3),rgba(131,255,247,1) calc(var(--step) * 4),rgba(120,148,255,1) calc(var(--step) * 5),rgb(216,117,255) calc(var(--step) * 6),rgb(255,119,115) calc(var(--step) * 7) ) 0% var(--bg-y)/200% 700% no-repeat",
    "--diagonal":
      "repeating-linear-gradient( 128deg,#0e152e 0%,hsl(180,10%,60%) 3.8%,hsl(180,10%,60%) 4.5%,hsl(180,10%,60%) 5.2%,#0e152e 10%,#0e152e 12% ) var(--bg-x) var(--bg-y)/300% no-repeat",
    "--shade":
      "radial-gradient( farthest-corner circle at var(--m-x) var(--m-y),rgba(255,255,255,0.1) 12%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0.25) 120% ) var(--bg-x) var(--bg-y)/300% no-repeat",
    backgroundBlendMode: "hue, hue, hue, overlay",
  } as any;

  const update = (clientX: number, clientY: number) => {
    if (!refElement.current) return;
    const rect = refElement.current.getBoundingClientRect();
    const x = (100 / rect.width) * (clientX - rect.left);
    const y = (100 / rect.height) * (clientY - rect.top);
    const { background, glare } = state.current;
    background.x = 50 + x / 4 - 12.5;
    background.y = 50 + y / 3 - 16.67;
    glare.x = x;
    glare.y = y;
    refElement.current.style.setProperty("--m-x", `${glare.x}%`);
    refElement.current.style.setProperty("--m-y", `${glare.y}%`);
    refElement.current.style.setProperty("--bg-x", `${background.x}%`);
    refElement.current.style.setProperty("--bg-y", `${background.y}%`);
  };

  return (
    <div
      ref={refElement}
      onPointerMove={(e) => update(e.clientX, e.clientY)}
      className="fixed inset-0 z-0 pointer-events-none"
    >
      <div
        className="absolute inset-0 opacity-60 dark:opacity-70"
        style={{
          background:
            "var(--pattern), var(--rainbow), var(--diagonal), var(--shade)",
          backgroundBlendMode: "hue, hue, hue, overlay",
          backgroundSize: "var(--foil-size), 200% 400%, 800%, 200%",
          backgroundPosition:
            "center, 0% var(--bg-y), calc(var(--bg-x) * -1) calc(var(--bg-y) * -1), var(--bg-x) var(--bg-y)",
          mixBlendMode: "color-dodge",
          ...backgroundStyle,
        }}
      />
      <div
        className="absolute inset-0 opacity-40 dark:opacity-60"
        style={{
          background:
            "radial-gradient(farthest-corner circle at var(--m-x) var(--m-y), rgba(255,255,255,0.8) 10%, rgba(255,255,255,0.65) 20%, rgba(255,255,255,0) 90%)",
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  );
}
