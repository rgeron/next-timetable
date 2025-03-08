"use client";

import { Button } from "@/components/ui/button";
import { AVAILABLE_COLORS } from "@/lib/file-it-data";
import { useMemo } from "react";
import { useSelection } from "./shared-utils";

type ColorItem = (typeof AVAILABLE_COLORS)[0];

export function ChooseColor(props: {
  onSelect?: (color: string) => void;
  selectedColor?: string;
}) {
  // Map the selectedColor string to a ColorItem for the useSelection hook
  const initialSelectedItem = useMemo(() => {
    if (!props.selectedColor) return undefined;
    return AVAILABLE_COLORS.find(
      (color) => color.value === props.selectedColor
    );
  }, [props.selectedColor]);

  const { selectedItem, handleSelect } =
    useSelection<ColorItem>(initialSelectedItem);

  const handleConfirmColor = () => {
    if (!selectedItem) return;

    if (props.onSelect) {
      props.onSelect(selectedItem.value);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Choose a Color</h2>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {AVAILABLE_COLORS.map((color) => (
          <ColorCard
            key={color.id}
            color={color}
            isSelected={selectedItem?.id === color.id}
            onSelect={() => handleSelect(color)}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleConfirmColor} disabled={!selectedItem}>
          Select Color
        </Button>
      </div>
    </div>
  );
}

function ColorCard(props: {
  color: ColorItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { color, isSelected, onSelect } = props;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`h-12 w-12 cursor-pointer rounded-full transition-all hover:scale-110 ${
          isSelected ? "ring-4 ring-primary ring-offset-2" : ""
        }`}
        style={{ backgroundColor: color.value }}
        onClick={onSelect}
        title={color.name}
      />
      <span className="text-xs text-muted-foreground">{color.name}</span>
    </div>
  );
}
