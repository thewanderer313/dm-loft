"use client";

export function LeaveCampaignButton({
  campaignName,
  action,
}: {
  campaignName: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Leave "${campaignName}"? Thy character will be struck from this chronicle.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="italic uppercase cursor-pointer"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 12,
          letterSpacing: "0.16em",
          color: "var(--tome-oxblood)",
          background: "transparent",
          border: "1px solid var(--tome-rule)",
          padding: "6px 12px",
        }}
      >
        Leave this chronicle
      </button>
    </form>
  );
}
