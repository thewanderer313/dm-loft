import Link from "next/link";
import { Shell } from "@/components/Shell";
import { TomePage, GildedRule, romanize } from "@/components/TomePage";
import { listMyCampaigns } from "@/lib/data/campaigns";
import { getServerSupabase } from "@/lib/supabase/server";

function relativeWhen(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const day = 86400000;
  const days = Math.floor(diff / day);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days hence`;
  if (days < 60) return "a moon ago";
  if (days < 365) return `${Math.floor(days / 30)} moons ago`;
  return `${Math.floor(days / 365)} years past`;
}

export default async function CampaignsPage() {
  const [campaigns, supabase] = await Promise.all([
    listMyCampaigns(),
    getServerSupabase(),
  ]);
  const { data: { user } } = await supabase.auth.getUser();

  const total = campaigns.length;

  return (
    <Shell>
      <TomePage chapter="DM Loft · Index of Campaigns" folio="ii">
        <div className="flex flex-col">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <div
                className="italic uppercase text-[13px]"
                style={{
                  fontFamily: "var(--tome-display)",
                  letterSpacing: "0.22em",
                  color: "var(--tome-gold)",
                }}
              >
                Index &middot; Liber Campaniarum
              </div>
              <h1
                className="mt-1"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontWeight: 600,
                  fontSize: "clamp(40px, 6vw, 64px)",
                  lineHeight: 0.95,
                  color: "var(--tome-ink)",
                }}
              >
                Of <em style={{ color: "var(--tome-oxblood)" }}>Campaigns</em>,
                {" "}
                <span style={{ color: "var(--tome-ink-soft)", fontWeight: 400 }}>kept &amp; in progress</span>
              </h1>
              <p
                className="italic mt-1"
                style={{
                  fontFamily: "var(--tome-body)",
                  fontSize: 16,
                  color: "var(--tome-ink-soft)",
                }}
              >
                every chronicle has its own pages, that one keeper may shepherd many tables.
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="cursor-pointer"
              style={{
                fontFamily: "var(--tome-display)",
                fontStyle: "italic",
                fontSize: 13,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                background: "var(--tome-oxblood)",
                color: "var(--tome-paper)",
                border: "1px solid var(--tome-oxblood)",
                padding: "10px 18px",
              }}
            >
              &oplus; Begin a new chronicle
            </Link>
          </div>

          <div className="my-5">
            <GildedRule />
          </div>

          {/* Header row */}
          <div
            className="hidden md:grid items-center"
            style={{
              gridTemplateColumns: "56px 1fr 160px 120px",
              gap: 14,
              fontFamily: "var(--tome-display)",
              fontStyle: "italic",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--tome-ink-faint)",
              padding: "8px 0",
              borderBottom: "1px solid var(--tome-rule)",
            }}
          >
            <span></span>
            <span>Title &amp; Argument</span>
            <span>Last entry</span>
            <span></span>
          </div>

          {total === 0 ? (
            <div
              className="my-8 p-10 text-center"
              style={{
                border: "1px dashed var(--tome-rule)",
                color: "var(--tome-ink-soft)",
                fontFamily: "var(--tome-display)",
                fontStyle: "italic",
                fontSize: 18,
              }}
            >
              The shelves are bare. Inscribe thy first chronicle to begin.
            </div>
          ) : (
            campaigns.map((cm, i) => {
              const isActive = i === 0;
              const initial = (cm.name.trim().charAt(0) || "·").toUpperCase();
              return (
                <div
                  key={cm.id}
                  className="grid items-center gap-4"
                  style={{
                    gridTemplateColumns: "56px 1fr 160px 120px",
                    padding: "18px 0",
                    borderBottom: "1px dotted var(--tome-rule)",
                    background: isActive ? "rgba(168,118,40,0.08)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: isActive ? "var(--tome-oxblood)" : "transparent",
                      border: `1px solid ${isActive ? "var(--tome-gold)" : "var(--tome-rule)"}`,
                      color: isActive ? "var(--tome-paper)" : "var(--tome-ink-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--tome-display)",
                      fontWeight: 600,
                      fontSize: 28,
                    }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <Link
                        href={`/c/${cm.id}`}
                        style={{
                          fontFamily: "var(--tome-display)",
                          fontWeight: 500,
                          fontSize: 26,
                          color: "var(--tome-ink)",
                          lineHeight: 1.05,
                        }}
                      >
                        {cm.name}
                      </Link>
                      {isActive && (
                        <span
                          className="italic uppercase"
                          style={{
                            fontFamily: "var(--tome-display)",
                            fontSize: 11,
                            color: "var(--tome-gold)",
                            letterSpacing: "0.16em",
                          }}
                        >
                          &mdash; current
                        </span>
                      )}
                    </div>
                    {cm.description && (
                      <div
                        className="italic mt-0.5"
                        style={{
                          fontFamily: "var(--tome-body)",
                          fontSize: 14,
                          color: "var(--tome-ink-soft)",
                        }}
                      >
                        {cm.description}
                      </div>
                    )}
                  </div>
                  <div
                    className="italic"
                    style={{
                      fontFamily: "var(--tome-display)",
                      fontSize: 13,
                      color: "var(--tome-ink-soft)",
                    }}
                  >
                    {relativeWhen(cm.last_opened_at)}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/campaigns/${cm.id}/edit`}
                      style={{
                        fontFamily: "var(--tome-display)",
                        fontStyle: "italic",
                        fontSize: 12,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: "transparent",
                        color: "var(--tome-ink-soft)",
                        border: "1px solid var(--tome-rule)",
                        padding: "5px 10px",
                      }}
                    >
                      edit
                    </Link>
                    <Link
                      href={`/c/${cm.id}`}
                      style={{
                        fontFamily: "var(--tome-display)",
                        fontStyle: "italic",
                        fontSize: 12,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: "transparent",
                        color: "var(--tome-ink)",
                        border: "1px solid var(--tome-ink)",
                        padding: "5px 10px",
                      }}
                    >
                      open &rsaquo;
                    </Link>
                  </div>
                </div>
              );
            })
          )}

          <div
            className="flex justify-between items-center pt-4 mt-2 gap-4 flex-wrap"
            style={{ borderTop: "1px solid var(--tome-rule)" }}
          >
            <div
              className="italic"
              style={{
                fontFamily: "var(--tome-display)",
                fontSize: 13,
                color: "var(--tome-ink-soft)",
              }}
            >
              <em style={{ color: "var(--tome-gold)" }}>{romanize(total)}</em>
              {" "}
              {total === 1 ? "chronicle" : "chronicles"} in keeping
              {total > 0 && (
                <>
                  {" "}&middot; <em>i</em> active.
                </>
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--tome-mono)",
                fontSize: 10,
                color: "var(--tome-ink-faint)",
                letterSpacing: "0.14em",
              }}
            >
              {user?.email ? `keeper · ${user.email}` : ""}
            </div>
          </div>
        </div>
      </TomePage>
    </Shell>
  );
}
