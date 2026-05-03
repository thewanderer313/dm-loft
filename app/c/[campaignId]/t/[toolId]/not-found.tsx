import Link from "next/link";
import { Shell } from "@/components/Shell";
import { TomePage, Eyebrow, GildedRule } from "@/components/TomePage";

export default function ToolNotFound() {
  return (
    <Shell>
      <TomePage chapter="DM Loft · Lost Pages" folio="·">
        <div className="max-w-md mx-auto pt-10 text-center">
          <Eyebrow>An Errant Search</Eyebrow>
          <h1
            className="text-4xl mt-2"
            style={{
              fontFamily: "var(--tome-display)",
              color: "var(--tome-ink)",
              fontWeight: 600,
            }}
          >
            Tool unavailable
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
            className="tome-btn mt-8 inline-block"
          >
            ← Back to the Loft
          </Link>
        </div>
      </TomePage>
    </Shell>
  );
}
