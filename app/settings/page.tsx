import { Shell } from "@/components/Shell";
import { TomePage, Eyebrow, GildedRule } from "@/components/TomePage";
import { getServerSupabase } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function SettingsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <Shell>
      <TomePage chapter="DM Loft · Of the Reader" folio="·">
        <div className="max-w-xl mx-auto pt-4">
          <Eyebrow>The Reader</Eyebrow>
          <h1
            className="text-4xl mt-1"
            style={{
              fontFamily: "var(--tome-display)",
              color: "var(--tome-ink)",
              fontWeight: 600,
            }}
          >
            Settings
          </h1>
          <GildedRule className="my-8" />

          <div className="tome-card p-5 mb-6">
            <div
              className="text-[11px] italic uppercase tracking-[0.22em]"
              style={{ fontFamily: "var(--tome-display)", color: "var(--tome-gold)" }}
            >
              Signed in as
            </div>
            <div
              className="text-xl mt-1"
              style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink)" }}
            >
              {user?.email ?? "—"}
            </div>
          </div>

          <form action={signOut}>
            <button type="submit" className="tome-btn">
              Sign out
            </button>
          </form>
        </div>
      </TomePage>
    </Shell>
  );
}
