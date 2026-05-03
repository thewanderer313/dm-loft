import * as React from "react";
import { Sigil } from "@/components/Sigil";

type Props = {
  children: React.ReactNode;
  folio?: string;
  chapter?: string;
  className?: string;
};

export function TomePage({
  children,
  folio = "i",
  chapter = "DM Loft",
  className = "",
}: Props) {
  return (
    <div
      className={`tome-page relative min-h-screen ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 30% 20%, rgba(180,140,80,0.06) 0%, transparent 55%), " +
          "radial-gradient(ellipse at 70% 80%, rgba(180,140,80,0.04) 0%, transparent 55%)",
      }}
    >
      <div
        className="absolute inset-4 sm:inset-6 pointer-events-none border"
        style={{ borderColor: "var(--tome-gold)", opacity: 0.85 }}
      />
      <div
        className="absolute inset-5 sm:inset-7 pointer-events-none border"
        style={{ borderColor: "var(--tome-gold-light)", opacity: 0.35 }}
      />

      <header
        className="relative px-8 sm:px-14 pt-7 pb-5 grid items-start gap-4"
        style={{
          fontFamily: "var(--tome-display)",
          color: "var(--tome-ink-faint)",
          gridTemplateColumns: "1fr auto 1fr",
        }}
      >
        <span
          className="italic uppercase text-[13px] leading-snug max-w-[28ch]"
          style={{ letterSpacing: "0.18em" }}
        >
          {chapter}
        </span>
        <span
          className="hidden sm:flex items-center gap-3 italic uppercase text-[13px]"
          style={{ letterSpacing: "0.22em", color: "var(--tome-ink-faint)" }}
        >
          <Sigil kind="ornament" size={14} color="var(--tome-gold)" strokeWidth={1.1} />
          <span>Anno · MMXXVI</span>
          <Sigil kind="ornament" size={14} color="var(--tome-gold)" strokeWidth={1.1} />
        </span>
        <span
          className="italic uppercase text-[13px] text-right justify-self-end"
          style={{ letterSpacing: "0.18em" }}
        >
          fol. {folio}
        </span>
      </header>

      <main className="relative px-6 sm:px-14 pb-20">{children}</main>
    </div>
  );
}

export function GildedRule({ className = "" }: { className?: string }) {
  return (
    <div className={`tome-rule-gilded ${className}`} aria-hidden>
      <span style={{ color: "var(--tome-gold)" }}>
        <Sigil kind="ornament" size={14} color="var(--tome-gold)" strokeWidth={1.1} />
      </span>
    </div>
  );
}

export function Illum({
  children,
  size = 72,
  fontSize = 56,
}: {
  children: React.ReactNode;
  size?: number;
  fontSize?: number;
}) {
  return (
    <div
      className="tome-illum"
      style={{
        width: size,
        height: size,
        fontSize,
      }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`tome-eyebrow ${className}`}>{children}</div>;
}

export function romanize(n: number): string {
  if (n <= 0) return "·";
  const m: [string, number][] = [
    ["m", 1000], ["cm", 900], ["d", 500], ["cd", 400], ["c", 100],
    ["xc", 90], ["l", 50], ["xl", 40], ["x", 10], ["ix", 9],
    ["v", 5], ["iv", 4], ["i", 1],
  ];
  let r = "";
  let x = n;
  for (const [s, v] of m) {
    while (x >= v) {
      r += s;
      x -= v;
    }
  }
  return r;
}
