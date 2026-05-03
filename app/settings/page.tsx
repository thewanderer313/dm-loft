import Link from "next/link";
import { Shell } from "@/components/Shell";
import { TomePage, GildedRule } from "@/components/TomePage";
import { getServerSupabase } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function SettingsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <Shell>
      <TomePage chapter="Of the Reader" folio="·">
        <div className="max-w-2xl">
          <div
            className="italic uppercase text-[13px]"
            style={{
              fontFamily: "var(--tome-display)",
              letterSpacing: "0.22em",
              color: "var(--tome-gold)",
            }}
          >
            The Reader
          </div>
          <h1
            className="mt-1"
            style={{
              fontFamily: "var(--tome-display)",
              fontWeight: 600,
              fontSize: "clamp(40px, 6vw, 60px)",
              lineHeight: 0.95,
              color: "var(--tome-ink)",
            }}
          >
            <em style={{ color: "var(--tome-oxblood)" }}>Settings</em>
          </h1>

          <div className="my-6">
            <GildedRule />
          </div>

          <div
            className="p-5 mb-6"
            style={{
              border: "1px solid var(--tome-rule)",
              background: "rgba(255,250,235,0.04)",
            }}
          >
            <div
              className="italic uppercase text-[13px]"
              style={{
                fontFamily: "var(--tome-display)",
                letterSpacing: "0.22em",
                color: "var(--tome-gold)",
              }}
            >
              Signed in as
            </div>
            <div
              className="mt-1"
              style={{
                fontFamily: "var(--tome-display)",
                fontSize: 22,
                color: "var(--tome-ink)",
              }}
            >
              {user?.email ?? "—"}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/campaigns"
              style={{
                fontFamily: "var(--tome-display)",
                fontStyle: "italic",
                fontSize: 13,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                background: "transparent",
                color: "var(--tome-ink)",
                border: "1px solid var(--tome-rule)",
                padding: "10px 18px",
              }}
            >
              ← back to library
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="cursor-pointer"
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
                Sign out
              </button>
            </form>
          </div>
        </div>
      </TomePage>
    </Shell>
  );
}
