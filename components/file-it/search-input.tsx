"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchInput(props: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={props.placeholder || "Search..."}
        value={props.searchQuery}
        onChange={(e) => props.setSearchQuery(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
