"use client";

import { Input } from "@/components/ui/input";
import { TimeSlot } from "@/lib/timetable";

type TimelineSlotProps = {
  slot: TimeSlot;
  onChange: (id: number, field: "start" | "end", value: string) => void;
  isFirst: boolean;
  compact?: boolean;
};

export function TimelineSlot({
  slot,
  onChange,
  isFirst,
  compact = false,
}: TimelineSlotProps) {
  return (
    <div
      className={`relative flex items-center ${compact ? "mb-2 py-1" : ""}`}
      title={
        isFirst
          ? "Début de journée"
          : `Point entre créneau ${slot.id - 1} et ${slot.id}`
      }
    >
      {/* Timeline dot */}
      <div
        className={`absolute left-6 ${
          compact ? "w-2.5 h-2.5" : "w-3 h-3"
        } rounded-full bg-primary transform -translate-x-1.5`}
      />

      {/* Time input for this point */}
      <div className={`ml-12 flex-1`}>
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
          className={`${compact ? "h-6 text-xs px-2 py-0" : "h-8"} w-24`}
          placeholder={isFirst ? "8h00" : "9h00"}
        />
      </div>

      {/* Slot description (only in non-compact mode) */}
      {!compact && (
        <div className="text-xs text-muted-foreground ml-3">
          {isFirst ? (
            <span className="text-green-500">Début de journée</span>
          ) : (
            <span>Créneau {slot.id}</span>
          )}
        </div>
      )}
    </div>
  );
}
