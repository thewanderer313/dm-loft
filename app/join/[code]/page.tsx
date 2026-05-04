import Link from "next/link";
import { TomePage, GildedRule } from "@/components/TomePage";
import { Sigil } from "@/components/Sigil";
import { getServerSupabase } from "@/lib/supabase/server";
import { joinCampaign } from "./actions";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const errorMessage = sp.error ? decodeURIComponent(sp.error) : null;
  const bound = joinCampaign.bind(null, code);

  // We pay an auth round-trip at render time so logged-out visitors see a
  // "Sign in to join" CTA rather than typing a character name into a form
  // that will immediately bounce them through /login. Worth the latency on
  // a low-volume route like this one.
  const supabase = await getServerSupabase();
  const { data: userResp } = await supabase.auth.getUser();
  const isSignedIn = !!userResp.user;

  return (
    <TomePage chapter="An Invitation" folio="·">
      <div className="max-w-xl mx-auto pt-6">
        <div className="flex items-start gap-5 mb-8">
          <span style={{ color: "var(--tome-oxblood)" }} aria-hidden>
            <Sigil kind="eye" size={40} strokeWidth={1.3} />
          </span>
          <div>
            <div
              className="italic uppercase text-[13px]"
              style={{
                fontFamily: "var(--tome-display)",
                letterSpacing: "0.22em",
                color: "var(--tome-gold)",
              }}
            >
              Of Joining
            </div>
            <h1
              className="mt-1"
              style={{
                fontFamily: "var(--tome-display)",
                fontWeight: 600,
                fontSize: "clamp(36px, 5vw, 52px)",
                lineHeight: 0.95,
                color: "var(--tome-ink)",
              }}
            >
              An <em style={{ color: "var(--tome-oxblood)" }}>Invitation</em> Awaits
            </h1>
            <p
              className="italic mt-2"
              style={{
                fontFamily: "var(--tome-body)",
                fontSize: 17,
                color: "var(--tome-ink-soft)",
              }}
            >
              {isSignedIn
                ? "Inscribe thy character's name to enter the chronicle. Thy name will be how the keeper and the rest of the table know thee at this table."
                : "Thou must first sign in. After that, thou'll return here to inscribe thy character's name and join."}
            </p>
          </div>
        </div>

        <GildedRule className="mb-8" />

        {isSignedIn ? (
          <form action={bound} className="flex flex-col gap-5">
            <label className="block">
              <span
                className="block italic uppercase text-[13px] mb-1"
                style={{
                  fontFamily: "var(--tome-display)",
                  letterSpacing: "0.18em",
                  color: "var(--tome-gold)",
                }}
              >
                Thy character&rsquo;s name
              </span>
              <input
                name="character_name"
                required
                minLength={1}
                maxLength={64}
                autoFocus
                placeholder="Vex the Wry"
                className="block w-full bg-transparent outline-none"
                style={{
                  borderBottom: "1px solid var(--tome-ink)",
                  paddingBottom: 4,
                  fontFamily: "var(--tome-display)",
                  fontWeight: 500,
                  fontSize: 28,
                  color: "var(--tome-ink)",
                }}
              />
            </label>

            <button
              type="submit"
              className="cursor-pointer mt-3"
              style={{
                fontFamily: "var(--tome-display)",
                fontStyle: "italic",
                fontSize: 14,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                background: "var(--tome-oxblood)",
                color: "var(--tome-paper)",
                border: "1px solid var(--tome-oxblood)",
                padding: "12px 22px",
              }}
            >
              Join the chronicle &rsaquo;
            </button>
          </form>
        ) : (
          <Link
            href={`/login?redirect_to=${encodeURIComponent(`/join/${code}`)}`}
            className="inline-block cursor-pointer"
            style={{
              fontFamily: "var(--tome-display)",
              fontStyle: "italic",
              fontSize: 14,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              background: "var(--tome-oxblood)",
              color: "var(--tome-paper)",
              border: "1px solid var(--tome-oxblood)",
              padding: "12px 22px",
            }}
          >
            Sign in to join &rsaquo;
          </Link>
        )}

        {errorMessage && (
          <p
            className="italic mt-5"
            style={{ color: "var(--tome-oxblood)", fontFamily: "var(--tome-body)" }}
          >
            {errorMessage}
          </p>
        )}

        <p
          className="italic mt-12"
          style={{
            fontFamily: "var(--tome-body)",
            fontSize: 14,
            color: "var(--tome-ink-faint)",
          }}
        >
          invite code:{" "}
          <span
            style={{
              fontFamily: "var(--tome-mono)",
              color: "var(--tome-ink-soft)",
            }}
          >
            {code}
          </span>
        </p>
      </div>
    </TomePage>
  );
}
