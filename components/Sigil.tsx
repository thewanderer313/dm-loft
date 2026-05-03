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
  | "star"
  | "note";

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
  const common = {
    stroke: color,
    strokeWidth,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const svg = {
    width: s,
    height: s,
    viewBox: `0 0 ${s} ${s}`,
  };

  switch (kind) {
    case "sword":
      return (
        <svg {...svg}>
          <line x1={s * 0.15} y1={s * 0.15} x2={s * 0.85} y2={s * 0.85} {...common} />
          <circle cx={s * 0.15} cy={s * 0.15} r={s * 0.05} {...common} />
          <line x1={s * 0.30} y1={s * 0.70} x2={s * 0.70} y2={s * 0.30} {...common} />
        </svg>
      );
    case "moon":
      return (
        <svg {...svg}>
          <path
            d={`M ${s * 0.7} ${s * 0.18} A ${s * 0.36} ${s * 0.36} 0 1 0 ${s * 0.7} ${s * 0.82} A ${s * 0.27} ${s * 0.36} 0 1 1 ${s * 0.7} ${s * 0.18} Z`}
            {...common}
          />
        </svg>
      );
    case "star":
      return (
        <svg {...svg}>
          <circle cx={c} cy={c} r={s * 0.34} {...common} />
          <line x1={c} y1={s * 0.05} x2={c} y2={s * 0.95} {...common} />
          <line x1={s * 0.05} y1={c} x2={s * 0.95} y2={c} {...common} />
          <line x1={s * 0.20} y1={s * 0.20} x2={s * 0.80} y2={s * 0.80} {...common} />
          <line x1={s * 0.20} y1={s * 0.80} x2={s * 0.80} y2={s * 0.20} {...common} />
        </svg>
      );
    case "crown":
      return (
        <svg {...svg}>
          <path
            d={`M ${s * 0.15} ${s * 0.7} L ${s * 0.20} ${s * 0.30} L ${s * 0.35} ${s * 0.55} L ${s * 0.50} ${s * 0.22} L ${s * 0.65} ${s * 0.55} L ${s * 0.80} ${s * 0.30} L ${s * 0.85} ${s * 0.7} Z`}
            {...common}
          />
          <line x1={s * 0.15} y1={s * 0.78} x2={s * 0.85} y2={s * 0.78} {...common} />
        </svg>
      );
    case "hex":
      return (
        <svg {...svg}>
          <path
            d={`M ${c} ${s * 0.10} L ${s * 0.85} ${s * 0.32} L ${s * 0.85} ${s * 0.68} L ${c} ${s * 0.90} L ${s * 0.15} ${s * 0.68} L ${s * 0.15} ${s * 0.32} Z`}
            {...common}
          />
          <circle cx={c} cy={c} r={s * 0.08} {...common} />
        </svg>
      );
    case "die":
      return (
        <svg {...svg}>
          <path
            d={`M ${c} ${s * 0.10} L ${s * 0.88} ${s * 0.36} L ${s * 0.74} ${s * 0.86} L ${s * 0.26} ${s * 0.86} L ${s * 0.12} ${s * 0.36} Z`}
            {...common}
          />
          <path
            d={`M ${c} ${s * 0.10} L ${s * 0.26} ${s * 0.86} M ${c} ${s * 0.10} L ${s * 0.74} ${s * 0.86} M ${s * 0.12} ${s * 0.36} L ${s * 0.88} ${s * 0.36}`}
            {...common}
          />
        </svg>
      );
    case "book":
      return (
        <svg {...svg}>
          <path
            d={`M ${s * 0.10} ${s * 0.20} L ${c} ${s * 0.30} L ${s * 0.90} ${s * 0.20} L ${s * 0.90} ${s * 0.80} L ${c} ${s * 0.85} L ${s * 0.10} ${s * 0.80} Z`}
            {...common}
          />
          <line x1={c} y1={s * 0.30} x2={c} y2={s * 0.85} {...common} />
        </svg>
      );
    case "eye":
      return (
        <svg {...svg}>
          <path
            d={`M ${s * 0.10} ${c} Q ${c} ${s * 0.20}, ${s * 0.90} ${c} Q ${c} ${s * 0.80}, ${s * 0.10} ${c} Z`}
            {...common}
          />
          <circle cx={c} cy={c} r={s * 0.12} {...common} />
        </svg>
      );
    case "ornament":
      return (
        <svg {...svg}>
          <path
            d={`M ${c} ${s * 0.20} Q ${s * 0.65} ${c}, ${c} ${s * 0.80} Q ${s * 0.35} ${c}, ${c} ${s * 0.20} Z`}
            {...common}
          />
          <circle cx={c} cy={c} r={s * 0.05} fill={color} stroke="none" />
        </svg>
      );
    case "note":
      return (
        <svg {...svg}>
          {/* Stem */}
          <line x1={s * 0.62} y1={s * 0.18} x2={s * 0.62} y2={s * 0.74} {...common} />
          {/* Flag — gentle curve off the top of the stem */}
          <path
            d={`M ${s * 0.62} ${s * 0.18} Q ${s * 0.86} ${s * 0.28}, ${s * 0.74} ${s * 0.46}`}
            {...common}
          />
          {/* Note head — a tilted oval */}
          <ellipse
            cx={s * 0.45}
            cy={s * 0.74}
            rx={s * 0.18}
            ry={s * 0.13}
            transform={`rotate(-20 ${s * 0.45} ${s * 0.74})`}
            {...common}
            fill={color}
          />
        </svg>
      );
  }
}
