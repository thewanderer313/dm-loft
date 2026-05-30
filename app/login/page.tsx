import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "./actions";
import { TomePage, GildedRule } from "@/components/TomePage";
import { Sigil } from "@/components/Sigil";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string; redirect_to?: string }>;
}) {
  const sp = await searchParams;

  return (
    <TomePage chapter="DM Loft · Of Entry & Welcome" folio="signum">
      <div
        className="grid items-center gap-10 lg:gap-14"
        style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 460px)" }}
      >
        {/* Left — colophon */}
        <section className="min-w-0">
          <div
            className="italic uppercase text-[13px]"
            style={{
              fontFamily: "var(--tome-display)",
              letterSpacing: "0.22em",
              color: "var(--tome-gold)",
            }}
          >
            being the title page of
          </div>
          <h1
            className="my-2"
            style={{
              fontFamily: "var(--tome-display)",
              fontWeight: 600,
              fontSize: "clamp(56px, 8vw, 96px)",
              lineHeight: 0.92,
              color: "var(--tome-ink)",
              letterSpacing: "-0.01em",
            }}
          >
            DM&nbsp;<em style={{ color: "var(--tome-oxblood)", fontStyle: "italic" }}>Loft</em>
          </h1>
          <p
            className="italic"
            style={{
              fontFamily: "var(--tome-display)",
              fontSize: 22,
              color: "var(--tome-ink-soft)",
              maxWidth: 480,
            }}
          >
            wherein every keeper&rsquo;s campaign is preserved &mdash; from the first lantern lit to
            the last bell tolled.
          </p>

          <div className="my-6" style={{ maxWidth: 480 }}>
            <GildedRule />
          </div>

          <p
            className="italic"
            style={{
              fontFamily: "var(--tome-body)",
              fontSize: 16,
              color: "var(--tome-ink-soft)",
              lineHeight: 1.5,
              maxWidth: 460,
            }}
          >
            Eight instruments wait within. The order of battle. The march of hours. The standing of
            factions. The compendium of fortunes. The keeper&rsquo;s charge, the rules thereof, the
            music &amp; ambience of the table, and a wordboard of evocative adjectives.
          </p>

          <div className="mt-7 flex items-center gap-4">
            <Sigil kind="ornament" size={20} color="var(--tome-gold)" strokeWidth={1.2} />
            <span
              style={{
                fontFamily: "var(--tome-mono)",
                fontSize: 12,
                color: "var(--tome-ink-faint)",
                letterSpacing: "0.18em",
              }}
            >
              EDITIO PRIMA &middot; ANNO MMXXVI
            </span>
            <Sigil kind="ornament" size={20} color="var(--tome-gold)" strokeWidth={1.2} />
          </div>
        </section>

        {/* Right — sign-in panel */}
        <section className="relative min-w-0">
          <div
            className="absolute pointer-events-none"
            style={{
              inset: -3,
              border: "1px solid var(--tome-gold-light)",
              opacity: 0.45,
            }}
            aria-hidden
          />
          <div
            style={{
              border: "1.5px solid var(--tome-gold)",
              padding: "28px 30px",
              background: "rgba(40,28,12,0.45)",
            }}
          >
            <div className="text-center mb-1">
              <Sigil kind="eye" size={36} color="var(--tome-oxblood)" strokeWidth={1.3} />
            </div>
            <div
              className="text-center italic uppercase text-[13px]"
              style={{
                fontFamily: "var(--tome-display)",
                letterSpacing: "0.28em",
                color: "var(--tome-gold)",
              }}
            >
              Of Entry
            </div>
            <h2
              className="text-center my-2"
              style={{
                fontFamily: "var(--tome-display)",
                fontWeight: 600,
                fontSize: 36,
                color: "var(--tome-ink)",
                lineHeight: 1.1,
              }}
            >
              Sign &amp; Enter
            </h2>

            <form action={signInWithGoogle} className="mt-3">
              {sp.redirect_to && <input type="hidden" name="redirect_to" value={sp.redirect_to} />}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 cursor-pointer"
                style={{
                  padding: "12px 16px",
                  fontFamily: "var(--tome-display)",
                  fontStyle: "italic",
                  fontSize: 15,
                  color: "var(--tome-ink)",
                  background: "transparent",
                  border: "1px solid var(--tome-ink)",
                }}
              >
                <span style={{ fontFamily: "var(--tome-mono)", fontSize: 14 }}>G</span>
                Continue with Google
              </button>
            </form>

            <div className="flex items-center gap-3 my-4" aria-hidden>
              <div className="flex-1 h-px" style={{ background: "var(--tome-rule)" }} />
              <span
                className="italic uppercase text-[13px]"
                style={{
                  fontFamily: "var(--tome-display)",
                  letterSpacing: "0.18em",
                  color: "var(--tome-ink-faint)",
                }}
              >
                or by sigil
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--tome-rule)" }} />
            </div>

            <form className="flex flex-col gap-3">
              {sp.redirect_to && <input type="hidden" name="redirect_to" value={sp.redirect_to} />}
              <label className="block">
                <span
                  className="block italic uppercase text-[13px] mb-1"
                  style={{
                    fontFamily: "var(--tome-display)",
                    letterSpacing: "0.16em",
                    color: "var(--tome-ink-soft)",
                  }}
                >
                  Name of correspondence
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="keeper@oakhart.dm"
                  className="block w-full bg-transparent outline-none"
                  style={{
                    borderBottom: "1px solid var(--tome-ink)",
                    paddingBottom: 4,
                    fontFamily: "var(--tome-body)",
                    fontSize: 16,
                    color: "var(--tome-ink)",
                  }}
                />
              </label>
              <label className="block">
                <span
                  className="block italic uppercase text-[13px] mb-1"
                  style={{
                    fontFamily: "var(--tome-display)",
                    letterSpacing: "0.16em",
                    color: "var(--tome-ink-soft)",
                  }}
                >
                  Pass-phrase
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="block w-full bg-transparent outline-none"
                  style={{
                    borderBottom: "1px solid var(--tome-ink)",
                    paddingBottom: 4,
                    fontFamily: "var(--tome-body)",
                    fontSize: 16,
                    color: "var(--tome-ink)",
                    letterSpacing: "0.14em",
                  }}
                />
              </label>

              <button
                type="submit"
                formAction={signInWithEmail}
                className="w-full mt-3 cursor-pointer"
                style={{
                  padding: 12,
                  background: "var(--tome-oxblood)",
                  color: "var(--tome-paper)",
                  fontFamily: "var(--tome-display)",
                  fontStyle: "italic",
                  fontSize: 14,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  border: "1px solid var(--tome-oxblood)",
                }}
              >
                Enter the Loft &rsaquo;
              </button>

              <button
                type="submit"
                formAction={signUpWithEmail}
                className="text-center cursor-pointer mt-1"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontStyle: "italic",
                  fontSize: 13,
                  color: "var(--tome-ink-soft)",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                }}
              >
                new keeper?{" "}
                <span
                  style={{
                    color: "var(--tome-oxblood)",
                    borderBottom: "1px solid var(--tome-oxblood)",
                  }}
                >
                  create a charter
                </span>
              </button>
            </form>

            {sp.error && (
              <p
                className="italic mt-4 text-sm"
                style={{ color: "var(--tome-oxblood)", fontFamily: "var(--tome-body)" }}
              >
                {decodeURIComponent(sp.error)}
              </p>
            )}
          </div>
        </section>
      </div>
    </TomePage>
  );
}
