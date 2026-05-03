import Link from "next/link";

export function Shell({
  children,
  rightSlot,
}: {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="tome-page min-h-screen flex flex-col">
      <header
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--tome-rule)" }}
      >
        <Link
          href="/"
          className="text-xl tracking-wide"
          style={{
            fontFamily: "var(--tome-display)",
            color: "var(--tome-oxblood)",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          DM Loft
        </Link>
        <div className="flex items-center gap-4">
          {rightSlot}
          <Link
            href="/settings"
            className="text-xs italic uppercase tracking-[0.18em]"
            style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
          >
            settings
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
