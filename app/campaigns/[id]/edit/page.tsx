import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { TomePage, GildedRule } from "@/components/TomePage";
import { getServerSupabase } from "@/lib/supabase/server";
import { renameCampaign, deleteCampaign } from "./actions";
import { DeleteCampaignButton } from "@/components/DeleteCampaignButton";

export default async function EditCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await getServerSupabase();
  const { data: c } = await supabase
    .from("campaigns")
    .select("id,name,description")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const renameBound = renameCampaign.bind(null, id);
  const deleteBound = deleteCampaign.bind(null, id);
  const initial = (c.name.trim().charAt(0) || "·").toUpperCase();

  return (
    <Shell>
      <TomePage chapter="Errata & Amendments" folio="·">
        <div className="max-w-3xl">
          <div
            className="italic uppercase text-[13px]"
            style={{
              fontFamily: "var(--tome-display)",
              letterSpacing: "0.22em",
              color: "var(--tome-gold)",
            }}
          >
            Errata &middot; Amend a chronicle
          </div>
          <div className="grid items-end gap-5" style={{ gridTemplateColumns: "72px minmax(0, 1fr)" }}>
            <div className="tome-illum mt-3" style={{ width: 72, height: 72, fontSize: 56 }}>
              {initial}
            </div>
            <h1
              className="break-words"
              style={{
                fontFamily: "var(--tome-display)",
                fontWeight: 600,
                fontSize: "clamp(40px, 6vw, 60px)",
                lineHeight: 0.95,
                color: "var(--tome-ink)",
              }}
            >
              {c.name}
            </h1>
          </div>

          <div className="my-6">
            <GildedRule />
          </div>

          <form action={renameBound} className="flex flex-col gap-5">
            <label className="block">
              <span
                className="block italic uppercase text-[13px] mb-1"
                style={{
                  fontFamily: "var(--tome-display)",
                  letterSpacing: "0.18em",
                  color: "var(--tome-gold)",
                }}
              >
                the title of the chronicle
              </span>
              <input
                name="name"
                required
                defaultValue={c.name}
                className="block w-full bg-transparent outline-none"
                style={{
                  borderBottom: "1px solid var(--tome-ink)",
                  paddingBottom: 4,
                  fontFamily: "var(--tome-display)",
                  fontWeight: 500,
                  fontSize: 28,
                  color: "var(--tome-ink)",
                }}
              />
            </label>

            <label className="block">
              <span
                className="block italic uppercase text-[13px] mb-1"
                style={{
                  fontFamily: "var(--tome-display)",
                  letterSpacing: "0.18em",
                  color: "var(--tome-gold)",
                }}
              >
                the argument
              </span>
              <textarea
                name="description"
                rows={4}
                defaultValue={c.description ?? ""}
                className="block w-full outline-none"
                style={{
                  padding: "12px 14px",
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
            </label>

            <div
              className="flex items-center gap-3 pt-4 mt-2 flex-wrap"
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
                Save changes
              </button>
              <Link
                href="/campaigns"
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
                ← back
              </Link>
            </div>
          </form>

          <div
            className="mt-12 pt-6"
            style={{ borderTop: "1px solid var(--tome-rule)" }}
          >
            <div
              className="italic uppercase text-[13px] mb-3"
              style={{
                fontFamily: "var(--tome-display)",
                letterSpacing: "0.22em",
                color: "var(--tome-gold)",
              }}
            >
              Excise this chronicle
            </div>
            <DeleteCampaignButton campaignName={c.name} action={deleteBound} />
          </div>

          {sp.error && (
            <p
              className="italic mt-4"
              style={{ color: "var(--tome-oxblood)", fontFamily: "var(--tome-body)" }}
            >
              {decodeURIComponent(sp.error)}
            </p>
          )}
        </div>
      </TomePage>
    </Shell>
  );
}
