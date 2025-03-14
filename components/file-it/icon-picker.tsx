"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

// Liste d'émojis couramment utilisés pour les matières et activités
const COMMON_ICONS = [
  // Matières scolaires
  "📚",
  "📘",
  "📗",
  "📙",
  "📕",
  "📓",
  "📔",
  "📒",
  "📝",
  "✏️",
  "📐",
  "📏",
  "🧮",
  "🔬",
  "🔭",
  "🧪",
  "🧫",
  "🧬",
  "🔍",
  "🌍",
  "🌎",
  "🌏",
  "🗺️",
  "🧠",
  "💻",
  "🖥️",
  "🖱️",
  "⌨️",
  "🎨",
  "🎭",
  "🎬",
  "🎵",
  "🎹",
  "🎸",
  "🎻",
  "🎷",
  "🎺",
  "🥁",
  "🏀",
  "⚽",
  "🏈",
  "⚾",
  "🎾",
  "🏐",
  "🏉",
  "🎱",
  "🏓",
  "🏸",
  "🏒",
  "🏑",
  "🥍",
  "🏏",
  "⛳",
  "🥊",
  "🥋",
  "🥅",
  "⛸️",
  "🎣",
  "🤿",
  "🏊‍♀️",
  "🚴‍♀️",
  "🧗‍♀️",
  "🏄‍♀️",
  "🏌️‍♀️",
  "🏇",
  "🧘‍♀️",
  "⛹️‍♀️",
  "🤸‍♀️",
  "🤼‍♀️",

  // Activités et loisirs
  "🎮",
  "🎲",
  "🎯",
  "🎳",
  "🎪",
  "🎠",
  "🎡",
  "🎢",
  "🧩",
  "🎰",
  "🎭",
  "🎨",
  "🧵",
  "🧶",
  "🎹",
  "🎷",
  "🎺",
  "🎸",
  "🎻",
  "🥁",
  "🎬",
  "📷",
  "📸",
  "📹",
  "📼",
  "📺",
  "📻",
  "🎧",
  "📱",
  "💻",
  "🖥️",
  "🎮",
  "🕹️",
  "🎲",
  "🧩",
  "🎯",
  "🎳",
  "🎪",
  "🎭",
  "🎨",
  "🧶",
  "🧵",
  "🧸",
  "🪁",
  "🪀",
  "🎈",
  "🎆",
  "🎇",
  "🧨",
  "✨",
  "🎉",
  "🎊",
  "🎎",
  "🎏",
  "🎐",
  "🎑",
  "🎀",
  "🎁",
  "🎗️",
  "🎟️",
  "🎫",
  "🎖️",
  "🏆",
  "🏅",
  "🥇",
  "🥈",
  "🥉",
  "⚽",
  "⚾",
  "🥎",
  "🏀",
  "🏐",
  "🏈",
  "🏉",
  "🎾",
  "🥏",
  "🎳",
  "🏏",
  "🏑",
  "🏒",
  "🥍",
  "🏓",
  "🏸",
  "🥊",
  "🥋",
  "🥅",
  "⛳",
  "⛸️",
  "🎣",
  "🤿",
  "🎽",
  "🎿",
  "🛷",
  "🥌",
  "🎯",
  "🪀",
  "🪁",
  "🎱",
  "🔮",
  "🧿",
  "🎮",
  "🕹️",
  "🎰",
  "🎲",
  "🧩",
  "🧸",
  "♟️",
  "🎭",
  "🖼️",
  "🎨",
  "🧵",
  "🧶",
  "👾",
  "🦺",
  "🥽",
  "🥼",
  "🧥",
  "👔",
  "👕",
  "👖",
  "🧣",
  "🧤",
  "🧦",
  "👗",
  "👘",
  "🥻",
  "🩱",
  "🩲",
  "🩳",
  "👙",
  "👚",
  "👛",
  "👜",
  "👝",
  "🛍️",
  "🎒",
  "👞",
  "👟",
  "🥾",
  "🥿",
  "👠",
  "👡",
  "🩰",
  "👢",
  "👑",
  "👒",
  "🎩",
  "🎓",
  "🧢",
  "⛑️",
  "💄",
  "💍",
  "💼",
];

type IconPickerProps = {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  onClose: () => void;
};

export function IconPicker({
  selectedIcon,
  onSelectIcon,
  onClose,
}: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIcon, setCurrentIcon] = useState(selectedIcon);

  const filteredIcons = searchTerm
    ? COMMON_ICONS.filter(
        (icon) =>
          // Simple filtering based on emoji description would require a library
          // For now, we'll just show all icons when searching
          true
      )
    : COMMON_ICONS;

  const handleIconSelect = (icon: string) => {
    setCurrentIcon(icon);
  };

  const handleApply = () => {
    onSelectIcon(currentIcon);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Choisir une icône</h3>
        <div className="w-8 h-8 flex items-center justify-center text-xl border rounded">
          {currentIcon}
        </div>
      </div>

      <Input
        placeholder="Rechercher une icône..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />

      <ScrollArea className="h-[200px] border rounded-md p-2">
        <div className="grid grid-cols-8 gap-1">
          {filteredIcons.map((icon, index) => (
            <button
              key={index}
              className={`w-8 h-8 flex items-center justify-center text-xl hover:bg-muted rounded ${
                currentIcon === icon ? "bg-muted ring-2 ring-primary" : ""
              }`}
              onClick={() => handleIconSelect(icon)}
            >
              {icon}
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Annuler
        </Button>
        <Button size="sm" onClick={handleApply}>
          Appliquer
        </Button>
      </div>
    </div>
  );
}
