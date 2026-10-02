"use client";

import Image from "next/image";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { LEAGUES } from "@/app/lib/leagues";
import { cn } from "@/lib/utils";

// Tabs own the fixture grid below them (TabsPanel) so each trigger has a real
// panel to point at; a bare tab list with no panel is a filter, not tabs.
export function LeagueSelector({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className="w-full">
      <TabsList
        aria-label="League"
        className="scrollbar-hide max-w-full justify-start overflow-x-auto"
      >
        {LEAGUES.map((l) => (
          <TabsTab key={l.key} value={l.key}>
            {/* Decorative: the tab label already names the league. */}
            <Image
              src={l.logo}
              alt=""
              width={20}
              height={20}
              className={cn("size-5 object-contain", l.logoDark && "dark:hidden")}
            />
            {l.logoDark && (
              <Image
                src={l.logoDark}
                alt=""
                width={20}
                height={20}
                className="hidden size-5 object-contain dark:block"
              />
            )}
            <span className="hidden sm:inline">{l.name}</span>
            <span className="sm:hidden">{l.shortName}</span>
          </TabsTab>
        ))}
      </TabsList>
      <TabsPanel value={value} className="mt-6">
        {children}
      </TabsPanel>
    </Tabs>
  );
}
