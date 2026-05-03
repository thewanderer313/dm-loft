import * as React from "react";

export type SigilKind =
  | "sword"
  | "moon"
  | "crown"
  | "hex"
  | "die"
  | "book"
  | "ornament"
  | "eye"
  | "star";

export function Sigil({
  kind,
  size = 24,
  color = "currentColor",
  strokeWidth = 1.25,
}: {
  kind: SigilKind;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const s = size;
  const c = s / 2;
  const base = {
    width: s,
    height: s,
    viewBox: `0 0 ${s} ${s}`,
    fill: "none" as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "sword":
      return (
        <svg {...base}>
          <line x1={c} y1={s * 0.1} x2={c} y2={s * 0.7} />
          <line x1={s * 0.3} y1={s * 0.7} x2={s * 0.7} y2={s * 0.7} />
          <line x1={c} y1={s * 0.7} x2={c} y2={s * 0.92} />
          <circle cx={c} cy={s * 0.95} r={s * 0.04} />
        </svg>
      );
    case "moon":
      return (
        <svg {...base}>
          <circle cx={c} cy={c} r={s * 0.4} />
          <path
            d={`M ${c + s * 0.05} ${c - s * 0.35} A ${s * 0.4} ${s * 0.4} 0 1 0 ${c + s * 0.05} ${c + s * 0.35} A ${s * 0.28} ${s * 0.4} 0 1 1 ${c + s * 0.05} ${c - s * 0.35} Z`}
            fill={color}
          />
        </svg>
      );
    case "crown":
      return (
        <svg {...base}>
          <path
            d={`M ${s * 0.15} ${s * 0.7} L ${s * 0.2} ${s * 0.35} L ${s * 0.35} ${s * 0.55} L ${c} ${s * 0.25} L ${s * 0.65} ${s * 0.55} L ${s * 0.8} ${s * 0.35} L ${s * 0.85} ${s * 0.7} Z`}
          />
          <line x1={s * 0.18} y1={s * 0.78} x2={s * 0.82} y2={s * 0.78} />
        </svg>
      );
    case "hex":
      return (
        <svg {...base}>
          <polygon
            points={`${c},${s * 0.12} ${s * 0.88},${s * 0.32} ${s * 0.88},${s * 0.68} ${c},${s * 0.88} ${s * 0.12},${s * 0.68} ${s * 0.12},${s * 0.32}`}
          />
          <circle cx={c} cy={c} r={s * 0.18} />
        </svg>
      );
    case "die":
      return (
        <svg {...base}>
          <polygon
            points={`${c},${s * 0.1} ${s * 0.88},${c} ${c},${s * 0.9} ${s * 0.12},${c}`}
          />
          <line x1={c} y1={s * 0.1} x2={c} y2={s * 0.9} />
          <line x1={s * 0.12} y1={c} x2={s * 0.88} y2={c} />
          <text
            x={c}
            y={c + s * 0.04}
            textAnchor="middle"
            fontSize={s * 0.22}
            fill={color}
            stroke="none"
            fontFamily="serif"
            fontStyle="italic"
          >
            xx
          </text>
        </svg>
      );
    case "book":
      return (
        <svg {...base}>
          <path
            d={`M ${s * 0.15} ${s * 0.25} L ${s * 0.15} ${s * 0.82} L ${c} ${s * 0.72} L ${s * 0.85} ${s * 0.82} L ${s * 0.85} ${s * 0.25} L ${c} ${s * 0.18} Z`}
          />
          <line x1={c} y1={s * 0.18} x2={c} y2={s * 0.72} />
        </svg>
      );
    case "ornament":
      return (
        <svg {...base}>
          <circle cx={c} cy={c} r={s * 0.12} />
          <path d={`M ${c} ${s * 0.1} L ${c} ${s * 0.3}`} />
          <path d={`M ${c} ${s * 0.7} L ${c} ${s * 0.9}`} />
          <path d={`M ${s * 0.1} ${c} L ${s * 0.3} ${c}`} />
          <path d={`M ${s * 0.7} ${c} L ${s * 0.9} ${c}`} />
        </svg>
      );
    case "eye":
      return (
        <svg {...base}>
          <path
            d={`M ${s * 0.1} ${c} Q ${c} ${s * 0.2}, ${s * 0.9} ${c} Q ${c} ${s * 0.8}, ${s * 0.1} ${c} Z`}
          />
          <circle cx={c} cy={c} r={s * 0.18} />
          <circle cx={c} cy={c} r={s * 0.06} fill={color} />
        </svg>
      );
    case "star":
      return (
        <svg {...base}>
          <polygon
            points={`${c},${s * 0.12} ${c + s * 0.1},${c - s * 0.1} ${s * 0.88},${c} ${c + s * 0.1},${c + s * 0.1} ${c},${s * 0.88} ${c - s * 0.1},${c + s * 0.1} ${s * 0.12},${c} ${c - s * 0.1},${c - s * 0.1}`}
          />
        </svg>
      );
  }
}
