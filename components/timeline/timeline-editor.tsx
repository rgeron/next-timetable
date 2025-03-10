"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TimeSlot,
  TimeTableData,
  getTimeTableData,
  saveTimeTableData,
} from "@/lib/timetable";
import { Plus } from "lucide-react";
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

  const addTimeSlot = () => {
    if (!timeSlots.length) return;

    setTimeSlots((currentSlots) => {
      // Create a new slot with the next ID
      const lastSlot = currentSlots[currentSlots.length - 1];
      const newSlotId = lastSlot.id + 1;

      // Default to 1 hour after the last end time
      const lastEndTime = lastSlot.end;
      const [hourStr, minStr] = lastEndTime.split("h");
      let hour = parseInt(hourStr, 10);
      const min = minStr ? parseInt(minStr, 10) : 0;

      // Calculate new times (1 hour later)
      let newStartHour = hour;
      let newStartMin = min;

      let newEndHour = hour + 1;
      let newEndMin = min;

      // Handle overflow for minutes and hours
      if (newEndHour >= 24) {
        newEndHour = 23;
        newEndMin = 59;
      }

      const newStart = `${newStartHour}h${
        newStartMin ? newStartMin.toString().padStart(2, "0") : "00"
      }`;
      const newEnd = `${newEndHour}h${
        newEndMin ? newEndMin.toString().padStart(2, "0") : "00"
      }`;

      const newSlot: TimeSlot = {
        id: newSlotId,
        start: newStart,
        end: newEnd,
      };

      return [...currentSlots, newSlot];
    });

    toast.success("Créneau ajouté");
  };

  const deleteTimeSlot = (id: number) => {
    // Don't allow deleting the first slot or if there's only one
    if (id === 1 || timeSlots.length <= 1) return;

    setTimeSlots((currentSlots) => {
      // Find the slot to delete
      const slotIndex = currentSlots.findIndex((slot) => slot.id === id);
      if (slotIndex === -1) return currentSlots;

      // Get the previous slot to update its end time
      const previousSlot = currentSlots[slotIndex - 1];
      const slotToDelete = currentSlots[slotIndex];

      // Create new array without the slot to delete
      const updatedSlots = currentSlots.filter((slot) => slot.id !== id);

      // Update the end time of the previous slot to match the end time of the deleted slot
      const previousSlotIndex = updatedSlots.findIndex(
        (slot) => slot.id === previousSlot.id
      );
      if (previousSlotIndex !== -1) {
        updatedSlots[previousSlotIndex] = {
          ...updatedSlots[previousSlotIndex],
          end: slotToDelete.end,
        };
      }

      // Update the IDs of all slots after the deleted one
      return updatedSlots.map((slot, index) => ({
        ...slot,
        id: index + 1,
      }));
    });

    toast.success("Créneau supprimé");
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

    // Also need to update the schedule to match the new time slots
    const updatedSchedule = timetableData.schedule.filter(
      (entry) => entry.timeSlotId <= timeSlots.length
    );

    // Add new entries for any new time slots
    const maxDayId = Math.max(...timetableData.days.map((day) => day.id));
    for (let dayId = 1; dayId <= maxDayId; dayId++) {
      for (let timeSlotId = 1; timeSlotId <= timeSlots.length; timeSlotId++) {
        const existingEntry = updatedSchedule.find(
          (entry) => entry.dayId === dayId && entry.timeSlotId === timeSlotId
        );

        if (!existingEntry) {
          updatedSchedule.push({
            id: updatedSchedule.length + 1,
            dayId,
            timeSlotId,
            type: "",
            entityId: "",
            room: "",
            notes: "",
            weekType: null,
            split: { enabled: false },
          });
        }
      }
    }

    // Save changes
    const updatedData = {
      ...timetableData,
      timeSlots: [...timeSlots],
      schedule: updatedSchedule,
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
            onDelete={deleteTimeSlot}
            isFirst={index === 0}
            compact={compact}
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

          {/* End time input */}
          <div className={`ml-12 flex-1 flex items-center`}>
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

            {/* Add new slot button */}
            <Button
              variant="ghost"
              size="icon"
              className={`ml-2 ${
                compact ? "h-5 w-5" : "h-7 w-7"
              } text-muted-foreground hover:text-primary`}
              onClick={addTimeSlot}
              title="Ajouter un créneau"
            >
              <Plus className={compact ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
          </div>

          {/* Description (only in non-compact mode) */}
          {!compact && (
            <div className="text-xs text-muted-foreground ml-3 flex items-center">
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
