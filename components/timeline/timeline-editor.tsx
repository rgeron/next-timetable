"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TimeSlot,
  TimeTableData,
  getTimeTableData,
  saveTimeTableData,
} from "@/lib/timetable";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TimelineSlot } from "./timeline-slot";

type TimelineEditorProps = {
  compact?: boolean;
};

export function TimelineEditor({ compact = false }: TimelineEditorProps) {
  const [timetableData, setTimetableData] = useState<TimeTableData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    // Load timetable data from localStorage
    const data = getTimeTableData();
    setTimetableData(data);
    setTimeSlots([...data.timeSlots]);
    setIsLoading(false);
  }, []);

  const handleTimeSlotChange = (
    id: number,
    field: "start" | "end",
    value: string
  ) => {
    setTimeSlots((currentSlots) => {
      // Create a copy of the current slots
      const updatedSlots = currentSlots.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      );

      // If we're changing an end time and it's not the last slot,
      // also update the start time of the next slot
      if (field === "end" && id < updatedSlots.length) {
        const nextSlotIndex = updatedSlots.findIndex(
          (slot) => slot.id === id + 1
        );
        if (nextSlotIndex !== -1) {
          updatedSlots[nextSlotIndex] = {
            ...updatedSlots[nextSlotIndex],
            start: value,
          };
        }
      }

      return updatedSlots;
    });
  };

  const saveChanges = () => {
    if (!timetableData) return;

    // Validate time entries
    const isValid = timeSlots.every((slot) => {
      const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3])h([0-5][0-9])?$/;
      return (
        timeRegex.test(slot.end) &&
        (slot.id === 1 || timeRegex.test(slot.start))
      );
    });

    if (!isValid) {
      toast.error(
        "Format d'heure invalide. Utilisez le format Xh ou XhYY (ex: 8h ou 8h30)"
      );
      return;
    }

    // Check if slots are in chronological order by comparing each slot's end time with its start time
    const isChronological = timeSlots.every((slot) => {
      const startHour = parseInt(slot.start.split("h")[0]);
      const startMin =
        slot.start.includes("h") && slot.start.split("h")[1]
          ? parseInt(slot.start.split("h")[1])
          : 0;

      const endHour = parseInt(slot.end.split("h")[0]);
      const endMin =
        slot.end.includes("h") && slot.end.split("h")[1]
          ? parseInt(slot.end.split("h")[1])
          : 0;

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      return endTime >= startTime;
    });

    if (!isChronological) {
      toast.error("L'heure de fin doit être postérieure à l'heure de début");
      return;
    }

    // Save changes
    const updatedData = {
      ...timetableData,
      timeSlots: [...timeSlots],
    };
    saveTimeTableData(updatedData);
    setTimetableData(updatedData);
    toast.success("Horaires mis à jour avec succès");

    // Trigger a custom event to notify of timetable data change
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  const resetChanges = () => {
    if (!timetableData) return;
    setTimeSlots([...timetableData.timeSlots]);
    toast.info("Modifications annulées");
  };

  if (isLoading || !timetableData) {
    return (
      <div
        className={`w-full flex items-center justify-center ${
          compact ? "h-[200px]" : "h-[300px]"
        }`}
      >
        <div className="animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className={`w-full ${compact ? "space-y-2" : "space-y-4"}`}>
      {/* Title section (only shown in standalone mode) */}
      {!compact && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            Ajustement des créneaux horaires
          </h3>
        </div>
      )}

      {/* Description (only shown in standalone mode) */}
      {!compact && (
        <p className="text-sm text-muted-foreground">
          Chaque point sur la ligne représente le début ou la fin d&apos;un
          créneau. Ajustez les horaires en modifiant la valeur à côté de chaque
          point.
        </p>
      )}

      {/* Timeline content */}
      <div
        className={`relative ${compact ? "space-y-2 mt-2 pb-2" : "space-y-3"}`}
      >
        {/* Timeline visual */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-muted" />

        {/* First show a note about time format */}
        {compact && (
          <div className="pl-12 text-xs text-muted-foreground mb-2">
            Format: 8h ou 8h30
          </div>
        )}

        {/* Time slots */}
        {timeSlots.map((slot, index) => (
          <TimelineSlot
            key={slot.id}
            slot={slot}
            onChange={handleTimeSlotChange}
            isFirst={index === 0}
            isLast={index === timeSlots.length - 1}
            compact={compact}
            prevEndTime={index > 0 ? timeSlots[index - 1].end : undefined}
          />
        ))}

        {/* Last point (end of last slot) */}
        <div
          className={`relative flex items-center ${compact ? "mb-2 py-1" : ""}`}
          title="Fin de journée"
        >
          {/* Timeline dot */}
          <div
            className={`absolute left-6 ${
              compact ? "w-2.5 h-2.5" : "w-3 h-3"
            } rounded-full bg-primary transform -translate-x-1.5`}
            title="Fin de journée"
          />

          {/* Last slot number */}
          <div
            className={`ml-12 ${
              compact ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-xs"
            } rounded-full bg-muted-foreground/10 flex items-center justify-center font-medium ${
              compact ? "hidden sm:flex" : ""
            }`}
          >
            {timeSlots.length + 1}
          </div>

          {/* End time input */}
          <div className={`${compact ? "ml-2 sm:ml-4" : "ml-4"} flex-1`}>
            <Input
              id={`end-${timeSlots.length}`}
              value={
                timeSlots.length > 0 ? timeSlots[timeSlots.length - 1].end : ""
              }
              onChange={(e) => {
                if (timeSlots.length > 0) {
                  handleTimeSlotChange(timeSlots.length, "end", e.target.value);
                }
              }}
              className={`${compact ? "h-6 text-xs px-2 py-0" : "h-8"} w-24`}
              placeholder="20h00"
              title="Heure de fin de journée"
            />
          </div>

          {/* Description (only in non-compact mode) */}
          {!compact && (
            <div className="text-xs text-muted-foreground ml-3">
              <span className="text-orange-500">Fin de journée</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className={`flex justify-end space-x-2 pt-2 ${compact ? "mt-4" : ""}`}
      >
        <Button variant="outline" size="sm" onClick={resetChanges}>
          Annuler
        </Button>
        <Button size="sm" onClick={saveChanges}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
