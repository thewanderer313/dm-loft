import Link from "next/link";
import { Shell } from "@/components/Shell";
import { TomePage, GildedRule } from "@/components/TomePage";

export default function ToolNotFound() {
  return (
    <Shell>
      <TomePage chapter="DM Loft · Lost Pages" folio="·">
        <div className="max-w-md mx-auto pt-10 text-center">
          <div
            className="italic uppercase text-[13px]"
            style={{
              fontFamily: "var(--tome-display)",
              letterSpacing: "0.22em",
              color: "var(--tome-gold)",
            }}
          >
            An Errant Search
          </div>
          <h1
            className="mt-2"
            style={{
              fontFamily: "var(--tome-display)",
              fontWeight: 600,
              fontSize: "clamp(36px, 5vw, 48px)",
              color: "var(--tome-ink)",
            }}
          >
            <em style={{ color: "var(--tome-oxblood)" }}>Tool unavailable</em>
          </h1>
          <div className="my-6">
            <GildedRule />
          </div>
          <p
            className="italic"
            style={{ color: "var(--tome-ink-soft)", fontFamily: "var(--tome-body)" }}
          >
            That tool isn&apos;t in the registry, or that campaign isn&apos;t yours.
          </p>
          <Link
            href="/"
            className="inline-block mt-8"
            style={{
              fontFamily: "var(--tome-display)",
              fontStyle: "italic",
              fontSize: 13,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              background: "transparent",
              color: "var(--tome-ink)",
              border: "1px solid var(--tome-ink)",
              padding: "10px 18px",
            }}
          >
            ← Back to the Loft
          </Link>
        </div>
      </TomePage>
    </Shell>
  );
}
