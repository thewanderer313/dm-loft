import { redirect } from "next/navigation";
import { pickDefaultCampaignId } from "@/lib/data/dashboard";

export default async function HomePage() {
  const id = await pickDefaultCampaignId();
  if (!id) redirect("/campaigns/new");
  redirect(`/c/${id}`);
}
