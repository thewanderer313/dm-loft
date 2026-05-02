import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function ToolNotFound() {
  return (
    <Shell>
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-lantern-gold text-2xl mb-3">Tool unavailable</h1>
        <p className="text-lantern-muted mb-4">
          That tool isn&apos;t in the registry, or that campaign isn&apos;t yours.
        </p>
        <Link href="/" className="text-lantern-gold hover:underline">← back to dashboard</Link>
      </div>
    </Shell>
  );
}
