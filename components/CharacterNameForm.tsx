"use client";

import * as React from "react";

export function CharacterNameForm({
  currentName,
  action,
}: {
  currentName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = React.useState(false);

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
          onClick={() => setEditing(true)}
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
    // We deliberately don't exit edit-mode on blur — that races with the
    // mouse-click submit on the save button (blur fires first, unmounts
    // the form before the click reaches it). Escape cancels instead.
    <form
      action={action}
      onSubmit={() => setEditing(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
      className="flex items-center gap-2"
    >
      <input
        name="character_name"
        defaultValue={currentName}
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
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="italic uppercase cursor-pointer"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--tome-ink-faint)",
          background: "transparent",
          border: "1px solid var(--tome-rule)",
          padding: "3px 8px",
        }}
      >
        cancel
      </button>
    </form>
  );
}
