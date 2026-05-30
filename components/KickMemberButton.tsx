"use client";

export function KickMemberButton({
  characterName,
  action,
}: {
  characterName: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Kick ${characterName} from this chronicle? Their character will be removed.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="cursor-pointer italic uppercase"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 12,
          letterSpacing: "0.1em",
          padding: "4px 10px",
          background: "transparent",
          color: "var(--tome-oxblood)",
          border: "1px solid var(--tome-rule)",
        }}
      >
        kick
      </button>
    </form>
  );
}
