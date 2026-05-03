"use client";

export function DeleteCampaignButton({
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
        if (!confirm(`Delete "${campaignName}"? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm italic underline-offset-2 hover:underline"
        style={{
          fontFamily: "var(--tome-display)",
          color: "var(--tome-oxblood)",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        Delete this campaign
      </button>
    </form>
  );
}
