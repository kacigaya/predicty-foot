"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { LEAGUES } from "@/app/lib/leagues";

// Tabs own the fixture grid below them (TabsContent) so each trigger has a real
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
          <TabsTrigger key={l.key} value={l.key}>
            <span aria-hidden>{l.flag}</span>
            <span className="hidden sm:inline">{l.name}</span>
            <span className="sm:hidden">{l.shortName}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={value} className="mt-8">
        {children}
      </TabsContent>
    </Tabs>
  );
}
