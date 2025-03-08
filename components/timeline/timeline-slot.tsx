"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeSlot } from "@/lib/timetable";

type TimelineSlotProps = {
  slot: TimeSlot;
  onChange: (id: number, field: "start" | "end", value: string) => void;
  isFirst: boolean;
  isLast: boolean;
  compact?: boolean;
};

export function TimelineSlot({
  slot,
  onChange,
  isFirst,
  isLast,
  compact = false,
}: TimelineSlotProps) {
  return (
    <div
      className={`relative flex items-center ${compact ? "mb-2 py-1" : ""}`}
      title={`Créneau ${slot.id}`}
    >
      {/* Timeline dot */}
      <div 
        className={`absolute left-6 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full bg-primary transform -translate-x-1.5`}
        title={isFirst ? "Début de journée" : isLast ? "Fin de journée" : `Créneau ${slot.id}`}
      />

      {/* Slot number */}
      <div
        className={`ml-12 ${compact ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'} rounded-full bg-muted-foreground/10 flex items-center justify-center font-medium ${
          compact ? "hidden sm:flex" : ""
        }`}
      >
        {slot.id}
      </div>

      {/* Times editors */}
      <div
        className={`${compact ? "ml-2 sm:ml-4" : "ml-4"} grid ${
          compact ? "grid-cols-2 gap-2" : "grid-cols-2 md:grid-cols-4 gap-3"
        } flex-1 items-center`}
      >
        <div className="space-y-1">
          <Label
            htmlFor={`start-${slot.id}`}
            className={`${
              compact ? "text-[10px] hidden sm:inline-block" : "text-xs"
            }`}
          >
            Début
          </Label>
          <Input
            id={`start-${slot.id}`}
            value={slot.start}
            onChange={(e) => onChange(slot.id, "start", e.target.value)}
            className={`${compact ? "h-6 text-xs px-2 py-0" : "h-8"}`}
            placeholder="8h00"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`end-${slot.id}`}
            className={`${
              compact ? "text-[10px] hidden sm:inline-block" : "text-xs"
            }`}
          >
            Fin
          </Label>
          <Input
            id={`end-${slot.id}`}
            value={slot.end}
            onChange={(e) => onChange(slot.id, "end", e.target.value)}
            className={`${compact ? "h-6 text-xs px-2 py-0" : "h-8"}`}
            placeholder="9h00"
          />
        </div>

        {!compact && (
          <>
            <div className="hidden md:block text-xs text-muted-foreground">
              {isFirst ? (
                <span className="text-green-500">Début de journée</span>
              ) : (
                <span>Suit: Créneau {slot.id - 1}</span>
              )}
            </div>

            <div className="hidden md:block text-xs text-muted-foreground">
              {isLast ? (
                <span className="text-orange-500">Fin de journée</span>
              ) : (
                <span>Précède: Créneau {slot.id + 1}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
