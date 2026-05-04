"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";

function originFromHeaders(h: Headers) {
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

// Accept only same-origin paths starting with "/" and reject anything that
// could become an external redirect (`://`, protocol-relative `//`).
function safeRedirect(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.includes("://") || raw.startsWith("//")) return "/";
  return raw;
}

// Build the /login?error=...&redirect_to=... query string for the
// "auth failed, send the user back to the form" path. Preserves the
// destination so the user can retry without losing it.
function loginRetryUrl(message: string, next: string): string {
  const errorPart = `error=${encodeURIComponent(message)}`;
  const nextPart = next === "/" ? "" : `&redirect_to=${encodeURIComponent(next)}`;
  return `/login?${errorPart}${nextPart}`;
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirect(formData.get("redirect_to"));
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
  const next = safeRedirect(formData.get("redirect_to"));
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
  const next = safeRedirect(formData?.get("redirect_to") ?? null);
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
