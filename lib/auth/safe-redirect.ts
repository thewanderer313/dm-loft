// Shared open-redirect validator for any flow that takes an after-auth
// destination from user input (the login form's redirect_to, the auth
// callback's next query param, etc.).
//
// Returns a same-origin path that can be safely passed to
// next/navigation's redirect(), or "/" if the input is missing,
// malformed, or attempting any of the canonical open-redirect bypasses.

export function safeRedirectPath(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/")) return "/";
  // Protocol-relative authority — //evil.com/path
  if (raw.startsWith("//")) return "/";
  // Backslash variant — /\\evil.com/path. Browsers' WHATWG URL parser
  // treats backslashes interchangeably with slashes in the authority
  // position, so /\evil.com resolves to https://evil.com.
  if (raw.startsWith("/\\")) return "/";
  // Any backslash anywhere in the path is suspicious; reject. Likewise
  // any C0 control char (NUL through US, plus DEL) — those get stripped
  // by the URL parser before authority resolution and have been the
  // root cause of many bypass CVEs.
  if (/[\x00-\x1f\x7f\\]/.test(raw)) return "/";
  // Embedded scheme (https://evil.com etc.).
  if (raw.includes("://")) return "/";
  return raw;
}
