"use client";

import { WeekSplitDialog } from "@/components/ui/week-split-dialog";
import {
  getEntityById,
  getScheduleEntry,
  saveTimeTableData,
  type ScheduleEntry,
  type TimeTableData,
} from "@/lib/timetable";
import { useTimetable } from "@/lib/timetable-context";
import { MapPin, Printer } from "lucide-react";
import React, { useEffect, useState } from "react";
import { calculateSlotHeight, useA4Preview } from "./print-timetable";
import { ThemedBorder } from "./themed-border";

// Type for the selected cell
type SelectedCell = {
  dayId: number;
  timeSlotId: number;
} | null;

// Type for week split dialog data
type WeekSplitDialogData = {
  isOpen: boolean;
  dayId: number;
  timeSlotId: number;
  existingEntityId: string;
  newEntityId: string;
} | null;

export function Timetable({
  onCellSelect,
  selectedCell,
  currentStep,
}: {
  onCellSelect: (cell: SelectedCell) => void;
  selectedCell: SelectedCell;
  currentStep: string;
}) {
  const { timetableData, isLoading, splitTimetableSlot } = useTimetable();
  // Always use A4 preview, no toggle needed
  const { containerStyle } = useA4Preview();
  const isA4Preview = true;
  const [weekSplitDialog, setWeekSplitDialog] =
    useState<WeekSplitDialogData>(null);

  // Listen for week split dialog events
  useEffect(() => {
    const handleShowWeekSplitDialog = (event: CustomEvent) => {
      const { dayId, timeSlotId, existingEntityId, newEntityId } = event.detail;
      setWeekSplitDialog({
        isOpen: true,
        dayId,
        timeSlotId,
        existingEntityId,
        newEntityId,
      });
    };

    window.addEventListener(
      "showWeekSplitDialog",
      handleShowWeekSplitDialog as EventListener
    );

    return () => {
      window.removeEventListener(
        "showWeekSplitDialog",
        handleShowWeekSplitDialog as EventListener
      );
    };
  }, []);

  const handleCloseWeekSplitDialog = () => {
    setWeekSplitDialog(null);
  };

  const handleReplaceSlot = () => {
    if (!weekSplitDialog || !timetableData) return;

    const { dayId, timeSlotId, newEntityId } = weekSplitDialog;

    // Update the entry with the new entity ID
    const updatedData = structuredClone(timetableData);
    const entry = updatedData.schedule.find(
      (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
    );

    if (entry) {
      entry.entityId = newEntityId;
      entry.weekType = null;
      entry.split = { enabled: false };

      // Save the updated data
      saveTimeTableData(updatedData);

      // Trigger a custom event to notify of timetable data change
      window.dispatchEvent(new Event("timetableDataChanged"));
    }

    // Close the dialog
    setWeekSplitDialog(null);
  };

  const handleSplitSlot = (weekAEntityId: string, weekBEntityId: string) => {
    if (!weekSplitDialog) return;

    const { dayId, timeSlotId } = weekSplitDialog;

    // Call the split function from context
    splitTimetableSlot(dayId, timeSlotId, weekAEntityId, weekBEntityId);

    // Close the dialog
    setWeekSplitDialog(null);
  };

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
    <div className="relative w-full print-container">
      {/* Week split dialog */}
      {weekSplitDialog && (
        <WeekSplitDialog
          isOpen={weekSplitDialog.isOpen}
          onClose={handleCloseWeekSplitDialog}
          onReplace={handleReplaceSlot}
          onSplit={handleSplitSlot}
          existingEntityId={weekSplitDialog.existingEntityId}
          newEntityId={weekSplitDialog.newEntityId}
        />
      )}

      <ThemedBorder
        theme={settings?.borderTheme || "none"}
        title={settings?.title || "Emploi du Temps"}
        fontFamily={settings?.fontFamily || "Inter"}
      >
        <div
          className="border overflow-hidden mx-auto timetable-container shadow-lg bg-white"
          style={{
            fontFamily: settings?.fontFamily || "inherit",
            width: "100%",
            height: "100%",
            ...containerStyle,
          }}
        >
          {/* Only show title if no border theme or theme is "none" */}
          {(!settings?.borderTheme || settings?.borderTheme === "none") && (
            <div className="p-3 text-center">
              <h2 className="text-lg font-bold mb-1">
                {settings?.title ? settings.title : "Emploi du Temps"}
              </h2>
              <div className="text-xs text-muted-foreground">
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
          )}

          <div className="grid timetable-grid" style={{ gridTemplateColumns }}>
            {/* Header cell for time column */}
            <div className="p-1 bg-muted/20 border-b border-r font-medium text-center timetable-header text-xs">
              Horaire
            </div>

            {/* Day headers */}
            {timetableData.days.map((day) => (
              <div
                key={day.id}
                className="p-1 bg-muted/20 border-b font-medium text-center timetable-header text-xs"
              >
                {day.name.charAt(0).toUpperCase() + day.name.slice(1)}
              </div>
            ))}

            {/* Time slots and schedule cells */}
            {timetableData.timeSlots.map((timeSlot, timeSlotIndex) => {
              const height = calculateSlotHeight(
                timeSlot.start,
                timeSlot.end,
                isA4Preview
              );

              return (
                <React.Fragment key={timeSlot.id}>
                  {/* Time column */}
                  <div
                    className="p-1 bg-muted/10 border-b border-r flex flex-col justify-center items-center timetable-time text-xs"
                    style={{ height: `${height}px` }}
                  >
                    <div className="text-xs font-medium">{timeSlot.start}</div>
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
                        isA4Preview={isA4Preview}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </ThemedBorder>

      {/* Print Controls - Only show print button, no toggle */}
      <div className="flex justify-end mb-4 items-center gap-2 no-print">
        <button
          onClick={() => {
            // Create a new window
            const printWindow = window.open("", "_blank");
            if (!printWindow) {
              alert(
                "Veuillez autoriser les popups pour imprimer l'emploi du temps."
              );
              return;
            }

            // Get the timetable HTML
            const timetableContainer = document.querySelector(
              ".timetable-container"
            );
            if (!timetableContainer || !timetableData) return;

            // Create HTML content for the print window
            const htmlContent = `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Emploi du Temps</title>
                  <style>
                    @page {
                      size: A4 landscape;
                      margin: 10mm;
                    }
                    body {
                      margin: 0;
                      padding: 10mm;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      color-adjust: exact !important;
                      font-family: system-ui, -apple-system, sans-serif;
                    }
                    .timetable-container {
                      width: 100% !important;
                      height: auto !important;
                      border: 1px solid #ddd;
                      box-shadow: none !important;
                      transform: none !important;
                    }
                    .timetable-grid {
                      display: grid;
                      width: 100%;
                    }
                    .timetable-header {
                      background-color: #f5f5f5 !important;
                      font-weight: bold;
                      padding: 8px;
                      text-align: center;
                      border-bottom: 1px solid #ddd;
                    }
                    .timetable-time {
                      background-color: #f9f9f9 !important;
                      padding: 8px;
                      text-align: center;
                      border-bottom: 1px solid #ddd;
                      border-right: 1px solid #ddd;
                    }
                    .timetable-cell {
                      page-break-inside: avoid;
                      break-inside: avoid;
                    }
                    * {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      color-adjust: exact !important;
                    }
                  </style>
                </head>
                <body onload="setTimeout(function() { window.print(); }, 500)">
                  <div style="text-align: center; margin-bottom: 15px;">
                    <h1 style="margin-bottom: 5px; font-size: 24px;">${
                      settings?.title || "Emploi du Temps"
                    }</h1>
                    <div style="font-size: 14px; color: #666;">
                      ${
                        timetableData.metadata.school
                          ? timetableData.metadata.school + " • "
                          : ""
                      }
                      ${
                        timetableData.metadata.year
                          ? timetableData.metadata.year + " • "
                          : ""
                      }
                      ${timetableData.metadata.class || ""}
                    </div>
                  </div>
                  ${timetableContainer.outerHTML}
                  <script>
                    window.addEventListener('afterprint', function() {
                      window.close();
                    });
                  </script>
                </body>
              </html>
            `;

            // Write to the new window
            printWindow.document.open();
            printWindow.document.write(htmlContent);
            printWindow.document.close();
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimer</span>
        </button>
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
  isA4Preview?: boolean;
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
        className={`p-0 border-b border-l hover:bg-muted/40 transition-colors cursor-pointer timetable-cell ${
          isSelected ? "ring-2 ring-primary" : ""
        } relative overflow-hidden`}
        style={{ height: `${height}px` }}
        data-schedule-id={entry?.id || ""}
        onClick={handleCellClick}
      >
        {entry?.tag ? (
          <div className="w-full h-full p-1 flex items-center justify-center">
            <div className="px-1 py-0.5 bg-muted rounded-md text-xs font-medium">
              {entry.tag}
            </div>
          </div>
        ) : (
          <div className="w-full h-full p-1 flex items-center justify-center text-muted-foreground text-xs">
            -
          </div>
        )}
      </div>
    );
  }

  const entity = getEntityById(timetableData, entry.entityId);

  // Handle week A/B split display
  let weekBadge = null;
  let entityB = null;

  if (entry.weekType) {
    weekBadge = (
      <div
        className="absolute top-0.5 right-0.5 text-[0.6rem] font-bold px-1 py-0.5 rounded-sm"
        style={{
          backgroundColor: entity?.color ? `${entity.color}40` : "#f0f0f0",
          color: entity?.color || "#000",
        }}
      >
        {entry.weekType}
      </div>
    );
  }

  if (entry.split?.enabled && entry.split.entityIdB) {
    entityB = getEntityById(timetableData, entry.split.entityIdB);

    // We'll set weekBadge to null because we'll show the A/B labels directly in the side-by-side layout
    weekBadge = null;
  }

  if (!entity) {
    return (
      <div
        className={`p-0 border-b border-l hover:bg-muted/40 transition-colors cursor-pointer timetable-cell ${
          isSelected ? "ring-2 ring-primary" : ""
        } relative overflow-hidden`}
        style={{ height: `${height}px` }}
        data-schedule-id={entry.id}
        onClick={handleCellClick}
      >
        <div className="w-full h-full p-1 flex items-center justify-center text-muted-foreground text-xs">
          {entry.entityId}
        </div>
        {weekBadge}
      </div>
    );
  }

  // Determine border classes based on continuity
  const borderClasses = `border-l ${!continuesToNext ? "border-b" : ""}`;

  return (
    <div
      className={`p-0 ${borderClasses} hover:bg-opacity-90 transition-colors cursor-pointer timetable-cell ${
        isSelected ? "ring-2 ring-primary" : ""
      } relative overflow-hidden`}
      style={{
        height: `${height}px`,
      }}
      data-schedule-id={entry.id}
      onClick={handleCellClick}
    >
      {/* Colored sidebar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: entity.color || "#f0f0f0" }}
      ></div>

      {/* Week badge */}
      {weekBadge}

      {/* Main content with semi-transparent background */}
      <div
        className="h-full w-full p-1 pl-1.5"
        style={{
          backgroundColor: entity.color ? `${entity.color}25` : "#f0f0f0",
        }}
      >
        {/* If this is a split cell, use a side-by-side layout */}
        {!continuesFromPrev && entry.split?.enabled && entityB ? (
          <div className="flex h-full -mx-1.5 -my-1 overflow-hidden relative">
            {/* Week A content - left side */}
            <div
              className="flex-1 p-1 pl-2 relative flex flex-col"
              style={{
                backgroundColor: entity.color ? `${entity.color}25` : "#f0f0f0",
              }}
            >
              {/* Single line layout for Week A and B */}
              <div className="flex items-center justify-between h-full">
                {/* Week A content */}
                <div className="flex items-center">
                  <div className="text-sm mr-1">{entity.icon}</div>
                  <div className="font-medium text-xs mr-1">
                    {entity.shortName}
                  </div>
                  <div
                    className="text-[0.6rem] font-bold px-1 py-0.5 rounded-sm"
                    style={{
                      backgroundColor: entity?.color || "#000",
                      color: "#fff",
                      border: `1px solid ${entity?.color || "#000"}`,
                    }}
                  >
                    A
                  </div>
                </div>

                {/* Room for Week A */}
                {entry.room && (
                  <div
                    className="text-[0.65rem] font-medium inline-flex items-center rounded-full px-1 py-0.5 ml-1"
                    style={{
                      backgroundColor: entity.color || "#000",
                      color: "#fff",
                    }}
                  >
                    <MapPin className="h-2 w-2 mr-1 opacity-70" />
                    <span>{entry.room}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vertical divider */}
            <div
              className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-[2px] bg-black"
              style={{
                height: "calc(100% + 2px)",
                marginTop: "-1px",
                marginBottom: "-1px",
              }}
            ></div>

            {/* Week B content - right side */}
            <div
              className="flex-1 p-1 pr-2 relative flex flex-col"
              style={{
                backgroundColor: entityB.color
                  ? `${entityB.color}25`
                  : "#f0f0f0",
              }}
            >
              {/* Week B content layout */}
              <div className="flex items-center justify-between h-full">
                {/* Week B content */}
                <div className="flex items-center">
                  <div className="text-sm mr-1">{entityB.icon}</div>
                  <div className="font-medium text-xs mr-1">
                    {entityB.shortName}
                  </div>
                  <div
                    className="text-[0.6rem] font-bold px-1 py-0.5 rounded-sm"
                    style={{
                      backgroundColor: entityB?.color || "#000",
                      color: "#fff",
                      border: `1px solid ${entityB?.color || "#000"}`,
                    }}
                  >
                    B
                  </div>
                </div>

                {/* Room for Week B */}
                {entry.split.roomB && (
                  <div
                    className="text-[0.65rem] font-medium inline-flex items-center rounded-full px-1 py-0.5 ml-1"
                    style={{
                      backgroundColor: entityB.color || "#000",
                      color: "#fff",
                    }}
                  >
                    <MapPin className="h-2 w-2 mr-1 opacity-70" />
                    <span>{entry.split.roomB}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Regular cell layout - Only show content if not continuing from previous cell */}
            {!continuesFromPrev ? (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="text-sm mr-1">{entity.icon}</div>
                    <div className="font-medium text-xs">
                      {entity.shortName}
                    </div>
                  </div>
                  {entry.room && (
                    <div
                      className="text-[0.60rem] font-medium inline-flex items-center rounded-full px-1 py-0.2"
                      style={{
                        backgroundColor: entity.color || "#000",
                        color: "#fff",
                      }}
                    >
                      <MapPin className="h-2 w-2 mr-1 opacity-70" />
                      <span>{entry.room}</span>
                    </div>
                  )}
                </div>

                {entry.notes && entry.notes.includes("Professeur:") && (
                  <div className="text-[0.60rem] font-medium mt-0.2 flex justify-end flex-wrap gap-1">
                    <span
                      className="inline-flex px-1.5 py-0.5 rounded-full text-white leading-none items-center"
                      style={{ backgroundColor: entity.color }}
                    >
                      {entry.notes
                        .split("\n")
                        .find((line) => line.startsWith("Professeur:"))
                        ?.replace("Professeur:", "")
                        .trim()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              // Empty div for cells that continue from previous - keeps the background color
              <div></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
