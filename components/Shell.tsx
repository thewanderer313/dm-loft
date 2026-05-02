import Link from "next/link";

export function Shell({
  children,
  rightSlot,
}: {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-lantern-bg">
      <header className="flex items-center justify-between px-5 py-3 border-b border-lantern-border bg-lantern-grad">
        <Link href="/" className="text-lantern-gold text-xl font-serif">
          DM Loft
        </Link>
        <div className="flex items-center gap-3">{rightSlot}</div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
