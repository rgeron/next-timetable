"use client";

import { AVAILABLE_COLORS } from "@/lib/file-it-data";
import { useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useSelection } from "./shared-utils";

type ColorItem = (typeof AVAILABLE_COLORS)[0];

export function ChooseColor(props: {
  onSelect?: (color: string) => void;
  selectedColor?: string;
}) {
  // État local pour stocker la couleur sélectionnée par le color picker
  const [customColor, setCustomColor] = useState(
    props.selectedColor || "#ef4444"
  );

  // Map the selectedColor string to a ColorItem for the useSelection hook
  const initialSelectedItem = useMemo(() => {
    if (!props.selectedColor) return undefined;
    return AVAILABLE_COLORS.find(
      (color) => color.value === props.selectedColor
    );
  }, [props.selectedColor]);

  const { selectedItem, handleSelect } =
    useSelection<ColorItem>(initialSelectedItem);

  const handleColorSelect = (color: ColorItem) => {
    handleSelect(color);
    setCustomColor(color.value);

    if (props.onSelect) {
      props.onSelect(color.value);
    }
  };

  // Gestion du changement de couleur via le color picker
  const handleColorChange = (color: string) => {
    setCustomColor(color);

    if (props.onSelect) {
      props.onSelect(color);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Color Picker */}
      <div className="w-full">
        <HexColorPicker
          color={customColor}
          onChange={handleColorChange}
          className="w-full"
        />
      </div>

      {/* Palette de couleurs prédéfinies */}
      <div>
        <h3 className="text-sm font-medium mb-2">Couleurs prédéfinies</h3>
        <div className="grid grid-cols-5 gap-2">
          {AVAILABLE_COLORS.map((color) => (
            <div key={color.id} className="flex flex-col items-center">
              <div
                className={`h-8 w-8 cursor-pointer rounded-full transition-all hover:scale-110 ${
                  selectedItem?.id === color.id || customColor === color.value
                    ? "ring-2 ring-primary ring-offset-1"
                    : ""
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorSelect(color)}
                title={color.name}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
