"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TimeSlot,
  TimeTableData,
  getTimeTableData,
  saveTimeTableData,
} from "@/lib/timetable";
import { Clock, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const timeSlotsRef = useRef<TimeSlot[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Load timetable data from localStorage
    const data = getTimeTableData();
    setTimetableData(data);
    setTimeSlots([...data.timeSlots]);
    timeSlotsRef.current = [...data.timeSlots];
    setIsLoading(false);
    initialLoadRef.current = false;
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

  // Auto-save with debounce whenever timeSlots change
  useEffect(() => {
    // Skip on initial load
    if (initialLoadRef.current || isLoading || !timetableData) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout for debouncing
    saveTimeoutRef.current = setTimeout(() => {
      // Only save if timeSlots have actually changed
      if (JSON.stringify(timeSlots) === JSON.stringify(timeSlotsRef.current)) {
        return;
      }

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

      // Check if slots are in chronological order
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

      // Update the schedule to match the new time slots
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
      timeSlotsRef.current = [...timeSlots];
      toast.success("Horaires mis à jour automatiquement");

      // Trigger a custom event to notify of timetable data change
      window.dispatchEvent(new Event("timetableDataChanged"));
    }, 1000); // 1 second debounce

    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [timeSlots]);

  const addTimeSlot = () => {
    if (!timeSlots.length) return;

    setTimeSlots((currentSlots) => {
      // Create a new slot with the next ID
      const lastSlot = currentSlots[currentSlots.length - 1];
      const newSlotId = lastSlot.id + 1;

      // Default to 1 hour after the last end time
      const lastEndTime = lastSlot.end;
      const [hourStr, minStr] = lastEndTime.split("h");
      const hour = parseInt(hourStr, 10);
      const min = minStr ? parseInt(minStr, 10) : 0;

      // Calculate new times (1 hour later)
      const newStartHour = hour;
      const newStartMin = min;

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

  if (isLoading || !timetableData) {
    return (
      <div
        className={`w-full flex items-center justify-center ${
          compact ? "h-[200px]" : "h-[300px]"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin text-primary">
            <Clock className="h-6 w-6" />
          </div>
          <div className="text-sm text-muted-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${compact ? "space-y-3" : "space-y-5"}`}>
      {/* Title section (only shown in standalone mode) */}
      {!compact && (
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">
              Ajustement des créneaux horaires
            </h3>
          </div>
        </div>
      )}

      {/* Description (only shown in standalone mode) */}
      {!compact && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground border border-muted">
          <p>
            Chaque point sur la ligne représente le début ou la fin d&apos;un
            créneau. Ajustez les horaires en modifiant la valeur à côté de
            chaque point. Les modifications sont enregistrées automatiquement.
          </p>
        </div>
      )}

      {/* Timeline content */}
      <div
        className={`relative ${
          compact ? "space-y-2 mt-3 pb-2" : "space-y-0 mt-4 pb-4"
        }`}
      >
        {/* Timeline visual - improved with gradient */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary to-primary/30 rounded-full" />

        {/* Time slots */}
        <div className="space-y-0">
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
        </div>

        {/* Last point (end of last slot) */}
        <div
          className={`relative flex items-center group ${
            compact ? "mb-2 py-1" : "mb-0 py-2 mt-3"
          }`}
          title="Fin de journée"
        >
          {/* Timeline dot */}
          <div className="absolute left-6 transform -translate-x-1.5 z-10">
            <div
              className={`${
                compact ? "w-3 h-3" : "w-4 h-4"
              } rounded-full bg-primary shadow-md relative`}
              title="Fin de journée"
            >
              {/* Inner dot */}
              <div className={`absolute inset-1 rounded-full bg-white`}></div>
            </div>
          </div>

          {/* End time input */}
          <div className={`ml-12 flex-1 flex items-center`}>
            <div className="relative">
              <Input
                id={`end-${timeSlots.length}`}
                value={
                  timeSlots.length > 0
                    ? timeSlots[timeSlots.length - 1].end
                    : ""
                }
                onChange={(e) => {
                  if (timeSlots.length > 0) {
                    handleTimeSlotChange(
                      timeSlots.length,
                      "end",
                      e.target.value
                    );
                  }
                }}
                className={`${
                  compact ? "h-7 text-xs px-3" : "h-9 text-sm"
                } w-28 pr-2 rounded-md border-muted-foreground/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all`}
                placeholder="20h00"
                title="Heure de fin de journée"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                fin
              </div>
            </div>

            {/* Add new slot button */}
            <Button
              variant="outline"
              size="sm"
              className={`ml-3 ${
                compact ? "h-7 px-2" : "h-9"
              } text-primary border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors group-hover:opacity-100`}
              onClick={addTimeSlot}
              title="Ajouter un créneau"
            >
              <Plus className={compact ? "h-3.5 w-3.5 mr-1" : "h-4 w-4 mr-1"} />
              <span className={compact ? "text-xs" : "text-sm"}>
                Ajouter un créneau
              </span>
            </Button>
          </div>

          {/* Description (only in non-compact mode) */}
          {!compact && (
            <div className="text-xs ml-3 min-w-24">
              <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                Fin de journée
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
