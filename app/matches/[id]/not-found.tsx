import Link from "next/link";
import { Button } from "@/app/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-xl bg-[#1e2430] text-3xl">
        ⚽
      </div>
      <h1 className="text-2xl font-bold text-white">Match not found</h1>
      <p className="text-sm text-[#7c8494]">
        This fixture may have already kicked off, been postponed, or isn&apos;t available from our odds provider.
      </p>
      <Button asChild>
        <Link href="/">Browse upcoming matches</Link>
      </Button>
    </div>
  );
}
