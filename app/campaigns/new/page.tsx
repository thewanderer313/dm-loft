import { Shell } from "@/components/Shell";
import { TomePage, GildedRule } from "@/components/TomePage";
import { NewCampaignForm } from "@/components/NewCampaignForm";
import { createCampaign } from "./actions";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errorMessage = sp.error ? decodeURIComponent(sp.error) : undefined;

  return (
    <Shell>
      <TomePage chapter="A New Chronicle" folio="i.°">
        <div className="flex flex-col">
          <div
            className="italic uppercase text-[13px]"
            style={{
              fontFamily: "var(--tome-display)",
              letterSpacing: "0.22em",
              color: "var(--tome-gold)",
            }}
          >
            Cap. ° &middot; Of Beginnings
          </div>
          <h1
            className="mt-1"
            style={{
              fontFamily: "var(--tome-display)",
              fontWeight: 600,
              fontSize: "clamp(40px, 6vw, 60px)",
              lineHeight: 0.95,
              color: "var(--tome-ink)",
            }}
          >
            A <em style={{ color: "var(--tome-oxblood)" }}>new</em> chronicle
          </h1>
          <p
            className="italic mt-1"
            style={{
              fontFamily: "var(--tome-body)",
              fontSize: 16,
              color: "var(--tome-ink-soft)",
              maxWidth: 720,
            }}
          >
            inscribe the title, the argument, and the manner of play. all may be amended hereafter.
          </p>

          <div className="my-5">
            <GildedRule />
          </div>

          <NewCampaignForm action={createCampaign} errorMessage={errorMessage} />
        </div>
      </TomePage>
    </Shell>
  );
}
