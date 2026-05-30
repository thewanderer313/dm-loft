"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

function originFromHeaders(h: Headers) {
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

// Build the /login?error=...&redirect_to=... query string for the
// "auth failed, send the user back to the form" path. Preserves the
// destination so the user can retry without losing it.
//
// When next === "/" we intentionally omit the `&redirect_to=` part:
// safeRedirectPath collapses missing/invalid input to "/", so emitting
// the param vs not is equivalent today, and skipping it keeps URLs
// short and reduces noise in error logs.
function loginRetryUrl(message: string, next: string): string {
  const errorPart = `error=${encodeURIComponent(message)}`;
  const nextPart = next === "/" ? "" : `&redirect_to=${encodeURIComponent(next)}`;
  return `/login?${errorPart}${nextPart}`;
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("redirect_to"));
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(loginRetryUrl(error.message, next));
  }
  redirect(next);
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("redirect_to"));
  const supabase = await getServerSupabase();
  const origin = originFromHeaders(await headers());
  const callbackUrl =
    next === "/"
      ? `${origin}/auth/callback`
      : `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callbackUrl },
  });
  if (error) {
    redirect(loginRetryUrl(error.message, next));
  }
  redirect(next);
}

export async function signInWithGoogle(formData?: FormData) {
  const next = safeRedirectPath(formData?.get("redirect_to"));
  const supabase = await getServerSupabase();
  const origin = originFromHeaders(await headers());
  const callbackUrl =
    next === "/"
      ? `${origin}/auth/callback`
      : `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl },
  });
  if (error) {
    redirect(loginRetryUrl(error.message, next));
  }
  if (data.url) redirect(data.url);
}
