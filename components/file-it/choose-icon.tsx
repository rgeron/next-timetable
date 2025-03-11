"use client";

import { Card } from "@/components/ui/card";
import { AVAILABLE_ICONS } from "@/lib/file-it-data";
import { useMemo } from "react";
import { useSearch, useSelection } from "./shared-utils";

type IconItem = (typeof AVAILABLE_ICONS)[0];

export function ChooseIcon(props: {
  onSelect?: (icon: string) => void;
  selectedIcon?: string;
}) {
  const { searchQuery, setSearchQuery, filteredItems } =
    useSearch(AVAILABLE_ICONS);

  // Map the selectedIcon string to an IconItem for the useSelection hook
  const initialSelectedItem = useMemo(() => {
    if (!props.selectedIcon) return undefined;
    return AVAILABLE_ICONS.find((icon) => icon.value === props.selectedIcon);
  }, [props.selectedIcon]);

  const { selectedItem, handleSelect } =
    useSelection<IconItem>(initialSelectedItem);

  const handleIconSelect = (icon: IconItem) => {
    handleSelect(icon);
    
    if (props.onSelect) {
      props.onSelect(icon.value);
    }
  };

  // Group icons by category for better organization
  const groupedIcons = useMemo(() => {
    const groups: Record<string, IconItem[]> = {};

    filteredItems.forEach((icon) => {
      if (!groups[icon.category]) {
        groups[icon.category] = [];
      }
      groups[icon.category].push(icon);
    });

    return groups;
  }, [filteredItems]);

  return (
    <div className="flex flex-col gap-2">
      <div className="space-y-4 max-h-40 overflow-y-auto pr-1">
        {Object.entries(groupedIcons).map(([category, icons]) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              {category}
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {icons.map((icon) => (
                <Card
                  key={icon.id}
                  className={`flex cursor-pointer items-center justify-center p-2 text-xl transition-all hover:bg-accent ${
                    selectedItem?.id === icon.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleIconSelect(icon)}
                >
                  {icon.value}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
