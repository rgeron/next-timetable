"use client";

import {
  getEntityById,
  getScheduleEntry,
  type ScheduleEntry,
  type TimeTableData,
} from "@/lib/timetable";
import { useTimetable } from "@/lib/timetable-context";
import React from "react";

// Type for the selected cell
type SelectedCell = {
  dayId: number;
  timeSlotId: number;
} | null;

// Function to calculate minutes from time string (e.g. "8h30" -> 510 minutes)
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split("h");
  return parseInt(hours) * 60 + (minutes ? parseInt(minutes) : 0);
}

// Function to calculate slot height based on duration
function calculateSlotHeight(start: string, end: string): number {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  // Calculate duration in minutes
  const durationMinutes = endMinutes - startMinutes;

  // Base height is 20px per 15 minutes (adjust as needed)
  return Math.max(durationMinutes * (20 / 15), 40); // Minimum height of 40px
}

export function Timetable({
  onCellSelect,
  selectedCell,
  currentStep,
}: {
  onCellSelect: (cell: SelectedCell) => void;
  selectedCell: SelectedCell;
  currentStep: string;
}) {
  const { timetableData, isLoading } = useTimetable();

  if (isLoading || !timetableData) {
    return (
      <div className="w-full p-4 flex items-center justify-center h-[600px]">
        <div className="animate-pulse">
          Chargement de l&apos;emploi du temps...
        </div>
      </div>
    );
  }

  // Get global settings for styling
  const globalSettings = localStorage.getItem("timetableGlobalSettings");
  const settings = globalSettings ? JSON.parse(globalSettings) : null;

  // Calculer le nombre de colonnes pour la grille
  const numDays = timetableData.days.length;
  const gridTemplateColumns = `100px repeat(${numDays}, 1fr)`;

  // Function to check if two entries have the same subject/activity
  const hasSameEntity = (
    entry1?: ScheduleEntry | null,
    entry2?: ScheduleEntry | null
  ) => {
    if (!entry1 || !entry2 || !entry1.entityId || !entry2.entityId)
      return false;
    return entry1.entityId === entry2.entityId;
  };

  return (
    <div className="w-full p-4">
      <div className="mb-4 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-2">
          {settings?.title ? settings.title : "Emploi du Temps"}
        </h2>
        <div className="text-sm text-muted-foreground">
          {timetableData.metadata.school && (
            <span>{timetableData.metadata.school} • </span>
          )}
          {timetableData.metadata.year && (
            <span>{timetableData.metadata.year} • </span>
          )}
          {timetableData.metadata.class && (
            <span>{timetableData.metadata.class}</span>
          )}
        </div>
      </div>

      <div
        className="border rounded-lg overflow-hidden"
        style={{
          fontFamily: settings?.fontFamily || "inherit",
          borderColor: settings?.borderColor || "inherit",
          borderWidth: settings?.borderWidth
            ? `${settings.borderWidth}px`
            : "1px",
        }}
      >
        <div className="grid" style={{ gridTemplateColumns }}>
          {/* Header cell for time column */}
          <div className="p-2 bg-muted/20 border-b border-r font-medium text-center">
            Horaire
          </div>

          {/* Day headers */}
          {timetableData.days.map((day) => (
            <div
              key={day.id}
              className="p-2 bg-muted/20 border-b font-medium text-center"
            >
              {day.name.charAt(0).toUpperCase() + day.name.slice(1)}
            </div>
          ))}

          {/* Time slots and schedule cells */}
          {timetableData.timeSlots.map((timeSlot, timeSlotIndex) => {
            const height = calculateSlotHeight(timeSlot.start, timeSlot.end);

            return (
              <React.Fragment key={timeSlot.id}>
                {/* Time column */}
                <div
                  className="p-2 bg-muted/10 border-b border-r flex flex-col justify-center items-center"
                  style={{ height: `${height}px` }}
                >
                  <div className="text-sm font-medium">{timeSlot.start}</div>
                  <div className="text-xs text-muted-foreground">
                    {timeSlot.end}
                  </div>
                </div>

                {/* Schedule cells for each day */}
                {timetableData.days.map((day) => {
                  const entry = getScheduleEntry(
                    timetableData,
                    day.id,
                    timeSlot.id
                  );

                  // Check if this entry continues from previous time slot
                  const prevTimeSlot =
                    timeSlotIndex > 0
                      ? timetableData.timeSlots[timeSlotIndex - 1]
                      : null;
                  const prevEntry = prevTimeSlot
                    ? getScheduleEntry(timetableData, day.id, prevTimeSlot.id)
                    : null;

                  // Check if this entry continues to next time slot
                  const nextTimeSlot =
                    timeSlotIndex < timetableData.timeSlots.length - 1
                      ? timetableData.timeSlots[timeSlotIndex + 1]
                      : null;
                  const nextEntry = nextTimeSlot
                    ? getScheduleEntry(timetableData, day.id, nextTimeSlot.id)
                    : null;

                  const continuesFromPrev = hasSameEntity(entry, prevEntry);
                  const continuesToNext = hasSameEntity(entry, nextEntry);

                  return (
                    <ScheduleCell
                      key={`${day.id}-${timeSlot.id}`}
                      entry={entry}
                      timetableData={timetableData}
                      height={height}
                      dayId={day.id}
                      timeSlotId={timeSlot.id}
                      onCellSelect={onCellSelect}
                      isSelected={
                        selectedCell?.dayId === day.id &&
                        selectedCell?.timeSlotId === timeSlot.id
                      }
                      isPersonalizeStep={currentStep === "personnaliser"}
                      continuesFromPrev={continuesFromPrev}
                      continuesToNext={continuesToNext}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScheduleCell({
  entry,
  timetableData,
  height,
  dayId,
  timeSlotId,
  onCellSelect,
  isSelected,
  isPersonalizeStep,
  continuesFromPrev,
  continuesToNext,
}: {
  entry?: ScheduleEntry | null;
  timetableData: TimeTableData;
  height: number;
  dayId: number;
  timeSlotId: number;
  onCellSelect: (cell: SelectedCell) => void;
  isSelected: boolean;
  isPersonalizeStep: boolean;
  continuesFromPrev?: boolean;
  continuesToNext?: boolean;
}) {
  const { addToTimetableSlot } = useTimetable();

  const handleCellClick = () => {
    if (isPersonalizeStep) {
      // In personalize step, select the cell for customization
      onCellSelect({ dayId, timeSlotId });
    } else {
      // Dispatch a custom event for timetable slot selection
      // This will be used by the eraser mode in FileItPanel
      window.dispatchEvent(
        new CustomEvent("timetableSlotSelected", {
          detail: { dayId, timeSlotId },
        })
      );

      // In other steps, add a subject/activity to the cell
      console.log("Cell clicked:", {
        dayId,
        timeSlotId,
        entityId: entry?.entityId,
      });
      addToTimetableSlot(dayId, timeSlotId);
    }
  };

  if (!entry || !entry.entityId) {
    return (
      <div
        className={`p-2 border-b border-l hover:bg-muted/40 transition-colors cursor-pointer ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
        style={{ height: `${height}px` }}
        data-schedule-id={entry?.id || ""}
        onClick={handleCellClick}
      >
        {entry?.tag ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="px-2 py-1 bg-muted rounded-md text-sm font-medium">
              {entry.tag}
            </span>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            -
          </div>
        )}
      </div>
    );
  }

  const entity = getEntityById(timetableData, entry.entityId);

  if (!entity) {
    return (
      <div
        className={`p-2 border-b border-l hover:bg-muted/40 transition-colors cursor-pointer ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
        style={{ height: `${height}px` }}
        data-schedule-id={entry.id}
        onClick={handleCellClick}
      >
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          {entry.entityId}
        </div>
      </div>
    );
  }

  // Check if teacher should be displayed
  const showTeacherMatch = entry.notes.match(
    /ShowTeacher: (true|false)(?:\n|$)/
  );
  const shouldShowTeacher = showTeacherMatch
    ? showTeacherMatch[1] === "true"
    : false;

  // Extract teacher name from notes if it exists and should be shown
  const teacherInfo =
    shouldShowTeacher && entry.notes.includes("Professeur:") ? (
      <div className="text-xs mt-1 opacity-80">
        {entry.notes
          .split("\n")
          .find((line) => line.startsWith("Professeur:"))
          ?.replace("Professeur:", "Prof:")
          .trim()}
      </div>
    ) : null;

  // Determine border classes based on continuity
  const borderClasses = `border-l ${!continuesToNext ? "border-b" : ""}`;

  return (
    <div
      className={`p-2 ${borderClasses} hover:bg-opacity-90 transition-colors cursor-pointer ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      style={{
        height: `${height}px`,
        backgroundColor: entity.color || "#f0f0f0",
      }}
      data-schedule-id={entry.id}
      onClick={handleCellClick}
    >
      <div className="flex flex-col h-full">
        {/* Only show subject name and icon if this is the first cell in a sequence */}
        {!continuesFromPrev && (
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">{entity.shortName}</div>
            <div className="text-lg">{entity.icon}</div>
          </div>
        )}

        {/* Always show room info */}
        {entry.room && !continuesFromPrev && (
          <div className="text-xs mt-1 opacity-80">Salle: {entry.room}</div>
        )}

        {/* Show teacher info only if enabled and not continuing from previous */}
        {!continuesFromPrev && teacherInfo}
      </div>
    </div>
  );
}
