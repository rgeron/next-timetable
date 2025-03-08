"use client";

import { Button } from "@/components/ui/button";
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
    setTimeSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  };

  const saveChanges = () => {
    if (!timetableData) return;

    // Validate time entries
    const isValid = timeSlots.every((slot) => {
      const startRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3])h([0-5][0-9])?$/;
      const endRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3])h([0-5][0-9])?$/;
      return startRegex.test(slot.start) && endRegex.test(slot.end);
    });

    if (!isValid) {
      toast.error(
        "Format d'heure invalide. Utilisez le format Xh ou XhYY (ex: 8h ou 8h30)"
      );
      return;
    }

    // Check if slots are in chronological order
    const isChronological = timeSlots.every((slot, index, array) => {
      if (index === 0) return true;

      const prevSlot = array[index - 1];
      const prevHour = parseInt(prevSlot.end.split("h")[0]);
      const prevMin =
        prevSlot.end.includes("h") && prevSlot.end.split("h")[1]
          ? parseInt(prevSlot.end.split("h")[1])
          : 0;

      const currHour = parseInt(slot.start.split("h")[0]);
      const currMin =
        slot.start.includes("h") && slot.start.split("h")[1]
          ? parseInt(slot.start.split("h")[1])
          : 0;

      const prevTime = prevHour * 60 + prevMin;
      const currTime = currHour * 60 + currMin;

      return currTime >= prevTime;
    });

    if (!isChronological) {
      toast.error("Les créneaux doivent être dans l'ordre chronologique");
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
          Ajustez les heures de début et de fin pour chaque créneau horaire.
          Utilisez le format français (ex: 8h30).
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
            Format: 8h ou 8h30 (heure + &apos;h&apos; + minutes)
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
          />
        ))}
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
