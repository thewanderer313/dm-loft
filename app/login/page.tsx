import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "./actions";
import { TomePage, Eyebrow, GildedRule, Illum } from "@/components/TomePage";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  return (
    <TomePage chapter="DM Loft · Of Beginnings" folio="i">
      <div className="max-w-md mx-auto pt-10">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Illum>S</Illum>
          <Eyebrow>Welcome, traveller</Eyebrow>
          <h1
            className="text-4xl text-center"
            style={{
              fontFamily: "var(--tome-display)",
              color: "var(--tome-ink)",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Sign in to the Loft
          </h1>
          <GildedRule />
        </div>

        <form action={signInWithGoogle} className="mb-6">
          <button type="submit" className="tome-btn w-full">
            Continue with Google
          </button>
        </form>

        <div className="flex items-center gap-3 my-6" aria-hidden>
          <div className="flex-1 h-px" style={{ background: "var(--tome-rule)" }} />
          <span
            className="text-[11px] italic uppercase tracking-[0.22em]"
            style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
          >
            or by hand
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--tome-rule)" }} />
        </div>

        <form className="flex flex-col gap-5">
          <label className="block">
            <span
              className="block text-[11px] italic uppercase tracking-[0.2em] mb-1"
              style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
            >
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              placeholder="you@realm.example"
              className="tome-input"
            />
          </label>
          <label className="block">
            <span
              className="block text-[11px] italic uppercase tracking-[0.2em] mb-1"
              style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
            >
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="tome-input"
            />
          </label>

          <button type="submit" formAction={signInWithEmail} className="tome-btn tome-btn-primary mt-2">
            Sign in
          </button>
          <button
            type="submit"
            formAction={signUpWithEmail}
            className="text-sm italic"
            style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-soft)" }}
          >
            Create an account instead →
          </button>
        </form>

        {sp.error && (
          <p
            className="mt-5 text-sm italic"
            style={{ color: "var(--tome-oxblood)", fontFamily: "var(--tome-body)" }}
          >
            {decodeURIComponent(sp.error)}
          </p>
        )}
      </div>
    </TomePage>
  );
}
