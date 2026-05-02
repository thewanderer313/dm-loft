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
        className="text-red-400 text-sm hover:underline"
      >
        Delete this campaign
      </button>
    </form>
  );
}
