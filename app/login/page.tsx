import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "./actions";
import { Shell } from "@/components/Shell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Shell>
      <div className="max-w-sm mx-auto mt-16 p-6 bg-lantern-panel border border-lantern-border">
        <h1 className="text-lantern-gold text-2xl mb-4">Sign in</h1>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full py-2 mb-4 bg-lantern-panel2 border border-lantern-border text-lantern-gold hover:bg-lantern-border"
          >
            Continue with Google
          </button>
        </form>

        <div className="text-lantern-muted text-xs uppercase tracking-widest text-center mb-3">
          or email
        </div>

        <form className="flex flex-col gap-2">
          <input name="email" type="email" required placeholder="email"
                 className="px-2 py-1 bg-lantern-panel2 border border-lantern-border text-lantern-dim" />
          <input name="password" type="password" required placeholder="password"
                 className="px-2 py-1 bg-lantern-panel2 border border-lantern-border text-lantern-dim" />
          <button type="submit" formAction={signInWithEmail}
                  className="py-2 mt-1 bg-lantern-gold text-lantern-bg hover:opacity-90">
            Sign in
          </button>
          <button type="submit" formAction={signUpWithEmail}
                  className="py-2 text-lantern-dim text-sm hover:text-lantern-gold">
            Create account instead →
          </button>
        </form>

        {sp.error && (
          <p className="mt-3 text-red-400 text-sm">{decodeURIComponent(sp.error)}</p>
        )}
      </div>
    </Shell>
  );
}
