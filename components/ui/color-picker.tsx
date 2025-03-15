"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
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

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
  };

  const handleComplete = () => {
    if (onChangeComplete) {
      onChangeComplete();
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-label="Changer la couleur"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="space-y-3">
          <HexColorPicker color={color} onChange={handleColorChange} />
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button size="sm" className="w-full" onClick={handleComplete}>
            Appliquer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
