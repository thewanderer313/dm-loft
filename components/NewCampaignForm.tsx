"use client";

import * as React from "react";
import Link from "next/link";
import { Sigil } from "@/components/Sigil";

export function NewCampaignForm({
  action,
  errorMessage,
}: {
  action: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
}) {
  const [name, setName] = React.useState("");
  const [argument, setArgument] = React.useState("");
  const initial = (name.trim().charAt(0) || "·").toUpperCase();
  const spineText = (name.trim() || "Untitled").toUpperCase();
  const charCount = argument.length;

  return (
    <div
      className="grid gap-10 lg:gap-12"
      style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 360px)" }}
    >
      <form action={action} className="flex flex-col min-w-0">
        <div className="flex flex-col gap-6">
          {/* Drop-cap title row */}
          <div
            className="grid gap-5 items-start"
            style={{ gridTemplateColumns: "72px minmax(0, 1fr)" }}
          >
            <div className="tome-illum" style={{ width: 72, height: 72, fontSize: 56 }}>
              {initial}
            </div>
            <div>
              <label
                className="block italic uppercase text-[13px]"
                htmlFor="new-campaign-name"
                style={{
                  fontFamily: "var(--tome-display)",
                  letterSpacing: "0.18em",
                  color: "var(--tome-gold)",
                }}
              >
                the title of the chronicle
              </label>
              <input
                id="new-campaign-name"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Oakhart"
                className="block w-full bg-transparent outline-none mt-1"
                style={{
                  borderBottom: "1px solid var(--tome-ink)",
                  paddingBottom: 4,
                  fontFamily: "var(--tome-display)",
                  fontWeight: 500,
                  fontSize: 36,
                  color: "var(--tome-ink)",
                  letterSpacing: "-0.01em",
                }}
              />
              <div
                className="italic mt-1"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontSize: 12,
                  color: "var(--tome-ink-faint)",
                }}
              >
                e.g. &ldquo;Oakhart&rdquo;, &ldquo;The Salt Road&rdquo;
              </div>
            </div>
          </div>

          {/* Argument */}
          <div>
            <label
              htmlFor="new-campaign-description"
              className="italic uppercase text-[13px]"
              style={{
                fontFamily: "var(--tome-display)",
                letterSpacing: "0.18em",
                color: "var(--tome-gold)",
              }}
            >
              the argument
            </label>
            <textarea
              id="new-campaign-description"
              name="description"
              rows={4}
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
              placeholder="A weight upon the mountain. The party hails from…"
              className="block w-full mt-1 outline-none"
              style={{
                padding: "12px 14px",
                minHeight: 96,
                background: "rgba(255,250,235,0.05)",
                border: "1px solid var(--tome-rule)",
                fontFamily: "var(--tome-body)",
                fontStyle: "italic",
                fontSize: 16,
                color: "var(--tome-ink)",
                lineHeight: 1.45,
                resize: "vertical",
              }}
            />
            <div
              className="flex justify-between mt-1 italic"
              style={{
                fontFamily: "var(--tome-display)",
                fontSize: 13,
                color: "var(--tome-ink-faint)",
                letterSpacing: "0.1em",
              }}
            >
              <span>up to two pages</span>
              <span>{charCount} / 2000 characters</span>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Footer actions */}
        <div
          className="flex items-center gap-3 pt-5 mt-8 flex-wrap"
          style={{ borderTop: "1px solid var(--tome-rule)" }}
        >
          <button
            type="submit"
            className="cursor-pointer"
            style={{
              fontFamily: "var(--tome-display)",
              fontStyle: "italic",
              fontSize: 13,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              background: "var(--tome-oxblood)",
              color: "var(--tome-paper)",
              border: "1px solid var(--tome-oxblood)",
              padding: "10px 22px",
            }}
          >
            Inscribe &amp; begin &rsaquo;
          </button>
          <Link
            href="/campaigns"
            className="inline-block"
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
            Cancel
          </Link>
          <div className="flex-1" />
          <div
            className="italic"
            style={{
              fontFamily: "var(--tome-display)",
              fontSize: 12,
              color: "var(--tome-ink-faint)",
            }}
          >
            all chronicles are private to thee &middot;{" "}
            <em style={{ color: "var(--tome-gold)" }}>amend at any time</em>
          </div>
        </div>

        {errorMessage && (
          <p
            className="italic mt-3"
            style={{ color: "var(--tome-oxblood)", fontFamily: "var(--tome-body)" }}
          >
            {errorMessage}
          </p>
        )}
      </form>

      {/* Right — spine preview */}
      <aside className="flex flex-col gap-3 min-w-0">
        <div
          className="italic uppercase text-[13px]"
          style={{
            fontFamily: "var(--tome-display)",
            letterSpacing: "0.22em",
            color: "var(--tome-gold)",
          }}
        >
          preview &middot; the spine
        </div>
        <div
          className="relative flex flex-col items-center justify-center"
          style={{
            height: 360,
            background: "var(--tome-oxblood-deep)",
            border: "1.5px solid var(--tome-gold)",
            gap: 18,
            color: "var(--tome-gold)",
          }}
        >
          <Sigil kind="ornament" size={28} color="var(--tome-gold-light)" strokeWidth={1.2} />
          <div
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontFamily: "var(--tome-display)",
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: "0.18em",
              color: "var(--tome-gold-light)",
              maxHeight: "60%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {spineText}
          </div>
          <Sigil kind="ornament" size={28} color="var(--tome-gold-light)" strokeWidth={1.2} />
          <div
            className="absolute italic uppercase"
            style={{
              bottom: 16,
              fontFamily: "var(--tome-display)",
              fontSize: 13,
              letterSpacing: "0.22em",
              color: "var(--tome-gold-light)",
              opacity: 0.8,
            }}
          >
            MMXXVI
          </div>
        </div>
        <p
          className="italic"
          style={{
            fontFamily: "var(--tome-body)",
            fontSize: 13,
            color: "var(--tome-ink-soft)",
            lineHeight: 1.4,
          }}
        >
          Thy chronicle, as it shall appear in the index.
          <br />
          The spine is dyed in the colour of the chapter accent.
        </p>
      </aside>
    </div>
  );
}
