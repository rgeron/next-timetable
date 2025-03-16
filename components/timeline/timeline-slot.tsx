"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimeSlot } from "@/lib/timetable";
import { Trash2 } from "lucide-react";

type TimelineSlotProps = {
  slot: TimeSlot;
  onChange: (id: number, field: "start" | "end", value: string) => void;
  onDelete: (id: number) => void;
  isFirst: boolean;
  compact?: boolean;
};

export function TimelineSlot({
  slot,
  onChange,
  onDelete,
  isFirst,
  compact = false,
}: TimelineSlotProps) {
  return (
    <div
      className={`relative flex items-center group ${
        compact ? "mb-2 py-1" : "mb-3 py-2"
      }`}
      title={
        isFirst
          ? "Début de journée"
          : `Point entre créneau ${slot.id - 1} et ${slot.id}`
      }
    >
      {/* Timeline dot with pulse effect */}
      <div className="absolute left-6 transform -translate-x-1.5 z-10">
        <div
          className={`${
            compact ? "w-3 h-3" : "w-4 h-4"
          } rounded-full bg-primary shadow-md relative`}
        >
          {/* Inner dot */}
          <div className={`absolute inset-1 rounded-full bg-white`}></div>
        </div>
      </div>

      {/* Time input for this point */}
      <div className={`ml-12 flex-1 flex items-center`}>
        <div className="relative">
          <Input
            id={`time-point-${slot.id}`}
            value={slot.start}
            onChange={(e) => {
              const newValue = e.target.value;

              // Update this slot's start time
              onChange(slot.id, "start", newValue);

              // If not the first slot, also update the previous slot's end time
              if (!isFirst) {
                onChange(slot.id - 1, "end", newValue);
              }
            }}
            className={`${
              compact ? "h-7 text-xs px-3" : "h-9 text-sm"
            } w-28 pr-2 rounded-md border-muted-foreground/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all`}
            placeholder={isFirst ? "8h00" : "9h00"}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {isFirst ? "début" : ""}
          </div>
        </div>

        {/* Delete button - don't allow deleting the first slot */}
        {!isFirst && (
          <Button
            variant="ghost"
            size="icon"
            className={`ml-2 ${
              compact ? "h-6 w-6" : "h-8 w-8"
            } text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all duration-200`}
            onClick={() => onDelete(slot.id)}
            title="Supprimer ce créneau"
          >
            <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </Button>
        )}
      </div>

      {/* Slot description with improved styling */}
      <div className={`${compact ? "hidden" : "block"} text-xs ml-3 min-w-24`}>
        {isFirst ? (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            Début de journée
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
            Créneau {slot.id}
          </span>
        )}
      </div>
    </div>
  );
}
