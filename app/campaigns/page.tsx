import Link from "next/link";
import { Shell } from "@/components/Shell";
import { TomePage, Eyebrow, GildedRule, romanize } from "@/components/TomePage";
import { listMyCampaigns } from "@/lib/data/campaigns";

export default async function CampaignsPage() {
  const campaigns = await listMyCampaigns();
  return (
    <Shell>
      <TomePage chapter="DM Loft · Index of Campaigns" folio={romanize(2)}>
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10">
            <Eyebrow>The Library</Eyebrow>
            <h1
              className="text-5xl mt-2"
              style={{
                fontFamily: "var(--tome-display)",
                color: "var(--tome-ink)",
                fontWeight: 600,
                letterSpacing: "0.01em",
              }}
            >
              Thy Campaigns
            </h1>
            <div className="w-full max-w-sm mt-4">
              <GildedRule />
            </div>
          </div>

          <div className="flex items-center justify-end mb-6">
            <Link href="/campaigns/new" className="tome-btn tome-btn-primary">
              + Begin a New Tale
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div
              className="tome-card p-10 text-center"
              style={{ borderStyle: "dashed" }}
            >
              <p
                className="italic"
                style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-soft)", fontSize: 18 }}
              >
                The shelves are bare. Inscribe thy first campaign to begin.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {campaigns.map((c, i) => (
                <li
                  key={c.id}
                  className="tome-card p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <span
                      className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center"
                      style={{
                        fontFamily: "var(--tome-display)",
                        fontStyle: "italic",
                        color: "var(--tome-gold)",
                        border: "1px solid var(--tome-rule)",
                        fontSize: 20,
                      }}
                      aria-hidden
                    >
                      {romanize(i + 1)}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/c/${c.id}`}
                        className="text-2xl block truncate"
                        style={{
                          fontFamily: "var(--tome-display)",
                          color: "var(--tome-ink)",
                          fontWeight: 600,
                        }}
                      >
                        {c.name}
                      </Link>
                      {c.description && (
                        <p
                          className="text-sm italic mt-1"
                          style={{ color: "var(--tome-ink-soft)", fontFamily: "var(--tome-body)" }}
                        >
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/campaigns/${c.id}/edit`}
                    className="text-xs italic uppercase tracking-[0.18em] shrink-0"
                    style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </TomePage>
    </Shell>
  );
}
