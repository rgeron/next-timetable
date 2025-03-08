"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AVAILABLE_ICONS } from "@/lib/file-it-data";
import { useMemo } from "react";
import { SearchInput } from "./search-input";
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

  const handleConfirmIcon = () => {
    if (!selectedItem) return;

    if (props.onSelect) {
      props.onSelect(selectedItem.value);
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
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Choose an Icon</h2>

      <SearchInput
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search icons..."
      />

      <div className="space-y-6">
        {Object.entries(groupedIcons).map(([category, icons]) => (
          <div key={category}>
            <h3 className="mb-2 text-sm font-medium uppercase text-muted-foreground">
              {category}
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {icons.map((icon) => (
                <IconCard
                  key={icon.id}
                  icon={icon}
                  isSelected={selectedItem?.id === icon.id}
                  onSelect={() => handleSelect(icon)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleConfirmIcon} disabled={!selectedItem}>
          Select Icon
        </Button>
      </div>
    </div>
  );
}

function IconCard(props: {
  icon: IconItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { icon, isSelected, onSelect } = props;

  return (
    <Card
      className={`flex cursor-pointer items-center justify-center p-4 text-3xl transition-all hover:bg-accent ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      {icon.value}
    </Card>
  );
}
