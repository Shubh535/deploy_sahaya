import React from "react";

export type TreeProps = {
  x: number; // horizontal position (0-1)
  y: number; // vertical position (0-1)
  color: string; // glow color
  mood: string; // mood/activity type
  animate?: boolean;
};

// Minimalist glowing tree SVG with gentle sway and glow pulse
export default function Tree({ x, y, color, mood, animate }: TreeProps) {
  // Sway and glow animation via CSS
  return (
    <g style={{ transform: `translate(${x * 100}vw, ${y * 60}vh)` }}>
      <filter id={`glow-${color}`}>
        <feGaussianBlur stdDeviation="6" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <ellipse
        cx={0}
        cy={0}
        rx={18}
        ry={32}
        fill={color}
        opacity={0.7}
        filter={`url(#glow-${color})`}
        className={animate ? "tree-glow" : ""}
      />
      <rect x={-3} y={20} width={6} height={24} rx={3} fill="#a3a3a3" />
      {/* Optionally, add a mood icon or subtle label */}
      {/* <text x={0} y={-40} textAnchor="middle" fontSize="12" fill="#555">{mood}</text> */}
    </g>
  );
}
