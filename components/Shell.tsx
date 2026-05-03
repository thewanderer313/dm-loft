import Link from "next/link";
import { signOut } from "@/app/settings/actions";

export function Shell({
  children,
  rightSlot,
}: {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="tome-page relative min-h-screen flex flex-col">
      <nav
        className="flex items-center justify-between gap-6 px-6 py-3"
        style={{
          background: "rgba(26,20,16,0.92)",
          borderBottom: "1px solid var(--tome-rule-soft)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0"
          style={{
            fontFamily: "var(--tome-display)",
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: "0.04em",
            color: "var(--tome-ink)",
            textDecoration: "none",
          }}
        >
          DM <em style={{ color: "var(--tome-oxblood)", fontStyle: "italic" }}>Loft</em>
        </Link>

        {rightSlot && <div className="flex-1 flex justify-center min-w-0">{rightSlot}</div>}

        <div className="flex items-center gap-5 shrink-0">
          <Link
            href="/settings"
            className="italic uppercase"
            style={{
              fontFamily: "var(--tome-display)",
              fontSize: 13,
              letterSpacing: "0.18em",
              color: "var(--tome-ink-soft)",
              textDecoration: "none",
            }}
          >
            settings
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="cursor-pointer italic uppercase"
              style={{
                fontFamily: "var(--tome-display)",
                fontSize: 13,
                letterSpacing: "0.18em",
                color: "var(--tome-ink-soft)",
                background: "transparent",
                border: "none",
                padding: 0,
              }}
            >
              sign out
            </button>
          </form>
        </div>
      </nav>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
