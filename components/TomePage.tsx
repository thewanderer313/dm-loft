import * as React from "react";

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
          "radial-gradient(ellipse at 30% 20%, rgba(255,250,235,0.4) 0%, transparent 50%), " +
          "radial-gradient(ellipse at 70% 80%, rgba(180,140,80,0.08) 0%, transparent 50%)",
      }}
    >
      <div
        className="absolute inset-6 pointer-events-none border"
        style={{ borderColor: "var(--tome-gold)" }}
      />
      <div
        className="absolute inset-7 pointer-events-none border"
        style={{ borderColor: "var(--tome-gold-light)", opacity: 0.5 }}
      />

      <header
        className="relative px-12 pt-10 pb-4 flex items-center justify-between text-[11px] tracking-[0.18em] uppercase italic"
        style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
      >
        <span>{chapter}</span>
        <span className="hidden sm:flex items-center gap-2">✦ Anno · MMXXVI ✦</span>
        <span>fol. {folio}</span>
      </header>

      <main className="relative px-6 sm:px-12 pb-24">{children}</main>
    </div>
  );
}

export function GildedRule({ className = "" }: { className?: string }) {
  return <div className={`tome-rule-gilded ${className}`}>✦</div>;
}

export function Illum({ children }: { children: React.ReactNode }) {
  return <div className="tome-illum">{children}</div>;
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
  const m: [string, number][] = [
    ["m", 1000], ["cm", 900], ["d", 500], ["cd", 400], ["c", 100],
    ["xc", 90], ["l", 50], ["xl", 40], ["x", 10], ["ix", 9],
    ["v", 5], ["iv", 4], ["i", 1],
  ];
  let r = "";
  for (const [s, v] of m) {
    while (n >= v) {
      r += s;
      n -= v;
    }
  }
  return r;
}
