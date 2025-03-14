"use client";

import {
  getEntityById,
  getScheduleEntry,
  type ScheduleEntry,
  type TimeTableData,
} from "@/lib/timetable";
import { useTimetable } from "@/lib/timetable-context";
import React from "react";

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

export function Timetable() {
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

  return (
    <div className="w-full p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Emploi du Temps</h2>
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

      <div className="border rounded-lg overflow-hidden">
        <div className="w-full grid grid-cols-[100px_repeat(5,1fr)]">
          {/* Header Row with Days */}
          <div className="bg-muted p-2 border-b flex items-center justify-center font-medium">
            Horaires
          </div>
          {timetableData.days.map((day) => (
            <div
              key={day.id}
              className="bg-muted p-2 border-b border-l flex items-center justify-center font-medium capitalize"
            >
              {day.name}
            </div>
          ))}

          {/* Time Slots Rows */}
          {timetableData.timeSlots.map((timeSlot) => {
            const slotHeight = calculateSlotHeight(
              timeSlot.start,
              timeSlot.end
            );

            return (
              <React.Fragment key={timeSlot.id}>
                {/* Time Column */}
                <div
                  className="p-2 border-b flex flex-col items-center justify-center text-sm"
                  style={{ height: `${slotHeight}px` }}
                >
                  <span>{timeSlot.start}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{timeSlot.end}</span>
                </div>

                {/* Schedule Cells for Each Day */}
                {timetableData.days.map((day) => {
                  const entry = getScheduleEntry(
                    timetableData,
                    day.id,
                    timeSlot.id
                  );
                  return (
                    <ScheduleCell
                      key={`${day.id}-${timeSlot.id}`}
                      entry={entry}
                      timetableData={timetableData}
                      height={slotHeight}
                      dayId={day.id}
                      timeSlotId={timeSlot.id}
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
}: {
  entry?: ScheduleEntry | null;
  timetableData: TimeTableData;
  height: number;
  dayId: number;
  timeSlotId: number;
}) {
  const { addToTimetableSlot } = useTimetable();

  const handleCellClick = () => {
    console.log("Cell clicked:", {
      dayId,
      timeSlotId,
      entityId: entry?.entityId,
    });
    addToTimetableSlot(dayId, timeSlotId);
  };

  if (!entry || !entry.entityId) {
    return (
      <div
        className="p-2 border-b border-l hover:bg-muted/40 transition-colors cursor-pointer"
        style={{ height: `${height}px` }}
        data-schedule-id={entry?.id || ""}
        onClick={handleCellClick}
      >
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          -
        </div>
      </div>
    );
  }

  const entity = getEntityById(timetableData, entry.entityId);

  if (!entity) {
    return (
      <div
        className="p-2 border-b border-l hover:bg-muted/40 transition-colors cursor-pointer"
        style={{ height: `${height}px` }}
        data-schedule-id={entry.id}
        onClick={handleCellClick}
      >
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          Erreur
        </div>
      </div>
    );
  }

  if (entry.split.enabled && entry.split.entityIdB) {
    const entityB = getEntityById(timetableData, entry.split.entityIdB);

    return (
      <div
        className="p-2 border-b border-l hover:bg-muted/40 transition-colors cursor-pointer"
        style={{
          borderLeft: `4px solid ${entity.color}`,
          height: `${height}px`,
        }}
        data-schedule-id={entry.id}
        onClick={handleCellClick}
      >
        <div className="w-full h-full grid grid-rows-2 gap-1">
          {/* First entity */}
          <div
            className="p-1 rounded-md flex flex-col"
            style={{ backgroundColor: `${entity.color}20` }}
          >
            <div className="flex items-center">
              <span className="mr-1">{entity.icon}</span>
              <span className="font-medium text-sm">{entity.shortName}</span>
            </div>
            {entry.room && <div className="text-xs">Salle: {entry.room}</div>}
          </div>

          {/* Second entity */}
          {entityB && (
            <div
              className="p-1 rounded-md flex flex-col"
              style={{
                backgroundColor: `${entityB.color}20`,
                borderLeft: `2px solid ${entityB.color}`,
              }}
            >
              <div className="flex items-center">
                <span className="mr-1">{entityB.icon}</span>
                <span className="font-medium text-sm">{entityB.shortName}</span>
              </div>
              {entry.split.roomB && (
                <div className="text-xs">Salle: {entry.split.roomB}</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-2 border-b border-l hover:bg-muted/40 transition-colors cursor-pointer"
      style={{
        borderLeft: `4px solid ${entity.color}`,
        height: `${height}px`,
      }}
      data-schedule-id={entry.id}
      onClick={handleCellClick}
    >
      <div
        className="w-full h-full p-1 rounded-md flex flex-col"
        style={{ backgroundColor: `${entity.color}10` }}
      >
        <div className="flex items-center">
          <span className="mr-1">{entity.icon}</span>
          <span className="font-medium">{entity.shortName}</span>
        </div>
        {entry.room && <div className="text-xs mt-1">Salle: {entry.room}</div>}
        {entry.notes && (
          <div className="text-xs mt-1 line-clamp-2">{entry.notes}</div>
        )}
        {entry.weekType && (
          <div className="text-xs mt-auto self-end italic">
            {entry.weekType}
          </div>
        )}
      </div>
    </div>
  );
}
