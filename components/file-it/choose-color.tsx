"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";

export function ChooseColor(props: {
  onSelect?: (color: string) => void;
  selectedColor?: string;
}) {
  // État local pour stocker la couleur sélectionnée par le color picker
  const [customColor, setCustomColor] = useState(
    props.selectedColor || "#ef4444"
  );

  // Gestion du changement de couleur via le color picker
  const handleColorChange = (color: string) => {
    setCustomColor(color);

    if (props.onSelect) {
      props.onSelect(color);
    }
  };

  return (
    <div className="w-full">
      <HexColorPicker
        color={customColor}
        onChange={handleColorChange}
        className="w-full"
      />
    </div>
  );
}
