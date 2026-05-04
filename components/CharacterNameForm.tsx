"use client";

import * as React from "react";

export function CharacterNameForm({
  campaignId,
  currentName,
  action,
}: {
  campaignId: string;
  currentName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(currentName);

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <span
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 18,
            color: "var(--tome-ink)",
          }}
        >
          {currentName}
        </span>
        <button
          type="button"
          onClick={() => {
            setDraft(currentName);
            setEditing(true);
          }}
          className="italic uppercase cursor-pointer"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--tome-ink-faint)",
            background: "transparent",
            border: "1px solid var(--tome-rule)",
            padding: "2px 8px",
          }}
        >
          rename
        </button>
      </div>
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => setEditing(false)}
      className="flex items-center gap-2"
    >
      <input
        name="character_name"
        defaultValue={draft}
        required
        minLength={1}
        maxLength={64}
        autoFocus
        className="bg-transparent outline-none"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 18,
          color: "var(--tome-ink)",
          borderBottom: "1px solid var(--tome-ink)",
          padding: "1px 2px",
          minWidth: 200,
        }}
        onBlur={() => setEditing(false)}
      />
      <button
        type="submit"
        className="italic uppercase cursor-pointer"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--tome-paper)",
          background: "var(--tome-oxblood)",
          border: "1px solid var(--tome-oxblood)",
          padding: "3px 8px",
        }}
      >
        save
      </button>
      <input type="hidden" name="campaign_id" value={campaignId} />
    </form>
  );
}
