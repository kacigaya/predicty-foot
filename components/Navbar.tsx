import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2a2a25] bg-[#0a0a09]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="font-display text-3xl italic text-[#f4efe2] tracking-tight leading-none sm:text-4xl">
            Predicty
          </span>
          <span className="font-display text-3xl text-[#d8ff3e] leading-none sm:text-4xl">
            Foot
          </span>
        </Link>
      </div>
    </header>
  );
}
