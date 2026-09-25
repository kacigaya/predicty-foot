"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { LEAGUES } from "@/app/lib/leagues";

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
      <TabsList aria-label="League">
        {LEAGUES.map((l) => (
          <TabsTab key={l.key} value={l.key}>
            <span aria-hidden>{l.flag}</span>
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
