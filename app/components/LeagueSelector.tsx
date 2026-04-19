"use client";

import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { LEAGUES } from "@/app/lib/leagues";

export function LeagueSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className="w-full">
      <TabsList className="w-full justify-start">
        {LEAGUES.map((l) => (
          <TabsTrigger key={l.key} value={l.key} className="gap-1.5">
            <span aria-hidden>{l.flag}</span>
            <span className="hidden sm:inline">{l.name}</span>
            <span className="sm:hidden">{l.shortName}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
