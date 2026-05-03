import Link from "next/link";
import { Shell } from "@/components/Shell";
import { TomePage, Eyebrow, GildedRule, Illum } from "@/components/TomePage";
import { createCampaign } from "./actions";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Shell>
      <TomePage chapter="DM Loft · Of New Tales" folio="·">
        <div className="max-w-xl mx-auto pt-4">
          <div className="flex items-start gap-5 mb-8">
            <Illum>I</Illum>
            <div>
              <Eyebrow>Inscribe a New Campaign</Eyebrow>
              <h1
                className="text-4xl mt-1"
                style={{
                  fontFamily: "var(--tome-display)",
                  color: "var(--tome-ink)",
                  fontWeight: 600,
                }}
              >
                A Fresh Page
              </h1>
              <p
                className="text-sm italic mt-2"
                style={{ color: "var(--tome-ink-soft)" }}
              >
                Name thy world, then sketch its shape in a few short words.
              </p>
            </div>
          </div>

          <GildedRule className="mb-8" />

          <form action={createCampaign} className="flex flex-col gap-5">
            <label className="block">
              <span
                className="block text-[11px] italic uppercase tracking-[0.2em] mb-1"
                style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
              >
                Name
              </span>
              <input name="name" required className="tome-input" placeholder="The Hollow Crown" />
            </label>

            <label className="block">
              <span
                className="block text-[11px] italic uppercase tracking-[0.2em] mb-1"
                style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
              >
                Description
                <span className="not-italic normal-case tracking-normal ml-2 opacity-70">(optional)</span>
              </span>
              <textarea
                name="description"
                rows={4}
                className="tome-input"
                style={{ resize: "vertical" }}
                placeholder="A salt-stained kingdom where coin and crown have grown estranged…"
              />
            </label>

            <div className="flex items-center justify-between mt-3">
              <Link
                href="/campaigns"
                className="text-xs italic uppercase tracking-[0.18em]"
                style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
              >
                ← back to library
              </Link>
              <button type="submit" className="tome-btn tome-btn-primary">
                Inscribe
              </button>
            </div>

            {sp.error && (
              <p
                className="text-sm italic mt-2"
                style={{ color: "var(--tome-oxblood)" }}
              >
                {decodeURIComponent(sp.error)}
              </p>
            )}
          </form>
        </div>
      </TomePage>
    </Shell>
  );
}
