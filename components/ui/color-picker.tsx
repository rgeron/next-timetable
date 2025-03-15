"use client";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

export function ColorPicker({
  color,
  onChange,
  onChangeComplete,
}: {
  color: string;
  onChange: (color: string) => void;
  onChangeComplete?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState(color);

  // Update local color when the prop changes
  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  const handleColorChange = (newColor: string) => {
    setLocalColor(newColor);
    // Call onChange during selection to update the UI
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalColor(newColor);
    onChange(newColor);
  };

  // When the popover closes, ensure the color is applied
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onChangeComplete) {
      onChangeComplete();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: localColor }}
          aria-label="Changer la couleur"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="space-y-3">
          <HexColorPicker color={localColor} onChange={handleColorChange} />
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={localColor}
              onChange={handleInputChange}
              className="flex-1"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
