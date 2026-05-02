import { Shell } from "@/components/Shell";
import { getServerSupabase } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function SettingsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <Shell>
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-lantern-gold text-2xl mb-4">Settings</h1>
        <p className="text-lantern-dim text-sm mb-6">Signed in as {user?.email}.</p>
        <form action={signOut}>
          <button type="submit"
                  className="py-2 px-4 bg-lantern-panel2 border border-lantern-border text-lantern-gold hover:border-lantern-gold">
            Sign out
          </button>
        </form>
      </div>
    </Shell>
  );
}
