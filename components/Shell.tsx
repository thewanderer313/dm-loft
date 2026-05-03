import Link from "next/link";

export function Shell({
  children,
  rightSlot,
}: {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="tome-page relative min-h-screen">
      {children}
      <div className="fixed bottom-4 right-6 z-20 flex items-center gap-4 pointer-events-none">
        {rightSlot && <div className="pointer-events-auto">{rightSlot}</div>}
        <Link
          href="/"
          className="pointer-events-auto italic uppercase"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 10,
            color: "var(--tome-ink-faint)",
            letterSpacing: "0.18em",
            textDecoration: "none",
          }}
        >
          DM Loft
        </Link>
        <Link
          href="/settings"
          className="pointer-events-auto italic uppercase"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 10,
            color: "var(--tome-ink-faint)",
            letterSpacing: "0.18em",
            textDecoration: "none",
          }}
        >
          settings
        </Link>
      </div>
    </div>
  );
}
