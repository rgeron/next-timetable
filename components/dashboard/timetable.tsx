"use client";

import {
  getEntityById,
  getScheduleEntry,
  getTimeTableData,
  type ScheduleEntry,
  type TimeTableData,
} from "@/lib/timetable";
import React, { useEffect, useState } from "react";

export function Timetable() {
  const [timetableData, setTimetableData] = useState<TimeTableData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load timetable data from localStorage
    const data = getTimeTableData();
    setTimetableData(data);
    setIsLoading(false);

    // Listen for storage events to update the timetable when data changes
    const handleStorageChange = () => {
      const updatedData = getTimeTableData();
      setTimetableData(updatedData);
    };

    window.addEventListener("storage", handleStorageChange);

    // Listen for custom event from TimelineEditor
    const handleCustomEvent = () => {
      const updatedData = getTimeTableData();
      setTimetableData(updatedData);
    };

    window.addEventListener("timetableDataChanged", handleCustomEvent);

    // Refresh data every 2 seconds to catch any localStorage changes
    // This is needed because the storage event doesn't trigger in the same window
    // that made the change
    const intervalId = setInterval(() => {
      const updatedData = getTimeTableData();
      setTimetableData(updatedData);
    }, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("timetableDataChanged", handleCustomEvent);
      clearInterval(intervalId);
    };
  }, []);

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
          {timetableData.timeSlots.map((timeSlot) => (
            <React.Fragment key={timeSlot.id}>
              {/* Time Column */}
              <div className="p-2 border-b flex flex-col items-center justify-center text-sm">
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
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScheduleCell({
  entry,
  timetableData,
}: {
  entry?: ScheduleEntry | null;
  timetableData: TimeTableData;
}) {
  if (!entry || !entry.entityId) {
    return (
      <div className="p-2 border-b border-l h-[100px] hover:bg-muted/40 transition-colors">
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          -
        </div>
      </div>
    );
  }

  const entity = getEntityById(timetableData, entry.entityId);

  if (!entity) {
    return (
      <div className="p-2 border-b border-l h-[100px] hover:bg-muted/40 transition-colors">
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
        className="p-2 border-b border-l h-[100px] hover:bg-muted/40 transition-colors"
        style={{ borderLeft: `4px solid ${entity.color}` }}
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
      className="p-2 border-b border-l h-[100px] hover:bg-muted/40 transition-colors"
      style={{ borderLeft: `4px solid ${entity.color}` }}
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
