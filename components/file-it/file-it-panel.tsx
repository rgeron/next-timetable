"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Subject,
  getTimeTableData,
  saveTimeTableData,
} from "@/lib/timetable";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChooseActivity } from "./choose-activity";
import { ChooseColor } from "./choose-color";
import { ChooseIcon } from "./choose-icon";
import { ChooseSubject } from "./choose-subject";

export function FileItSidebar() {
  // State for tracking which entity type is selected (subject or activity)
  const [entityType, setEntityType] = useState<"subject" | "activity">(
    "subject"
  );

  // Selected entity after choosing
  const [selectedEntity, setSelectedEntity] = useState<
    (Subject | Activity) | null
  >(null);

  // Custom color and icon when customizing
  const [customColor, setCustomColor] = useState<string | undefined>();
  const [customIcon, setCustomIcon] = useState<string | undefined>();

  // Mode of the panel (choose, customize, apply)
  const [mode, setMode] = useState<"choose" | "customize" | "apply">("choose");

  // Setup event listener for clicking on timetable cells when in apply mode
  useEffect(() => {
    const handleTimeTableClick = (e: MouseEvent) => {
      // Only process clicks when we're in apply mode and have a selected entity
      if (mode !== "apply" || !selectedEntity) return;

      const target = e.target as HTMLElement;

      // Look for a schedule cell by traversing up the DOM
      let scheduleCell = target;
      while (scheduleCell && !scheduleCell.hasAttribute("data-schedule-id")) {
        scheduleCell = scheduleCell.parentElement as HTMLElement;
        if (!scheduleCell) break;
      }

      if (scheduleCell && scheduleCell.hasAttribute("data-schedule-id")) {
        const scheduleId = parseInt(
          scheduleCell.getAttribute("data-schedule-id") || "0"
        );
        if (scheduleId > 0) {
          applyEntityToScheduleEntry(scheduleId);
        }
      }
    };

    // Add click event listener to document
    document.addEventListener("click", handleTimeTableClick);

    // Cleanup
    return () => {
      document.removeEventListener("click", handleTimeTableClick);
    };
  }, [mode, selectedEntity]);

  // Apply the selected entity to a schedule entry
  const applyEntityToScheduleEntry = useCallback(
    (scheduleId: number) => {
      if (!selectedEntity) return;

      const timeTableData = getTimeTableData();

      // Find the schedule entry
      const scheduleEntryIndex = timeTableData.schedule.findIndex(
        (entry) => entry.id === scheduleId
      );
      if (scheduleEntryIndex === -1) return;

      // Update the schedule entry
      const updatedSchedule = [...timeTableData.schedule];
      updatedSchedule[scheduleEntryIndex] = {
        ...updatedSchedule[scheduleEntryIndex],
        type: entityType === "subject" ? "subject" : "activity",
        entityId: selectedEntity.id,
      };

      // Save the updated timetable
      saveTimeTableData({
        ...timeTableData,
        schedule: updatedSchedule,
      });

      // Trigger a custom event to refresh the timetable
      window.dispatchEvent(new Event("timetableDataChanged"));

      toast.success(`Applied ${selectedEntity.name} to the selected slot`);
    },
    [selectedEntity, entityType]
  );

  // Reset the state to initial values
  const resetState = useCallback(() => {
    setSelectedEntity(null);
    setCustomColor(undefined);
    setCustomIcon(undefined);
    setMode("choose");
  }, []);

  // Handle entity selection from subject or activity choosers
  const handleEntitySelect = useCallback((entity: Subject | Activity) => {
    setSelectedEntity(entity);
    setCustomColor(entity.color);
    setCustomIcon(entity.icon);
    setMode("customize");
  }, []);

  // Save customizations to the entity
  const handleCustomize = useCallback(() => {
    if (!selectedEntity || !customColor || !customIcon) return;

    const timeTableData = getTimeTableData();

    if (selectedEntity.id.startsWith("s-")) {
      // Update subject
      const updatedSubjects = timeTableData.subjects.map((subject) =>
        subject.id === selectedEntity.id
          ? { ...subject, color: customColor, icon: customIcon }
          : subject
      );

      saveTimeTableData({
        ...timeTableData,
        subjects: updatedSubjects,
      });
    } else if (selectedEntity.id.startsWith("a-")) {
      // Update activity
      const updatedActivities = timeTableData.activities.map((activity) =>
        activity.id === selectedEntity.id
          ? { ...activity, color: customColor, icon: customIcon }
          : activity
      );

      saveTimeTableData({
        ...timeTableData,
        activities: updatedActivities,
      });
    }

    // Update our local state
    setSelectedEntity({
      ...selectedEntity,
      color: customColor,
      icon: customIcon,
    });

    setMode("apply");

    // Trigger a custom event to refresh the timetable
    window.dispatchEvent(new Event("timetableDataChanged"));

    toast.success("Customizations saved! Now click on slots in the timetable.");
  }, [selectedEntity, customColor, customIcon]);

  // Render the customize view when in customize mode
  const renderCustomizeView = () => {
    if (!selectedEntity) return null;

    return (
      <div className="space-y-6">
        <Card className="flex items-center gap-4 p-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: customColor || selectedEntity.color }}
          >
            {customIcon || selectedEntity.icon}
          </div>
          <div>
            <h3 className="text-lg font-medium">{selectedEntity.name}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedEntity.shortName}
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <ChooseColor
            selectedColor={customColor || selectedEntity.color}
            onSelect={setCustomColor}
          />

          <ChooseIcon
            selectedIcon={customIcon || selectedEntity.icon}
            onSelect={setCustomIcon}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={resetState}>
            Back
          </Button>
          <Button onClick={handleCustomize}>Save & Apply</Button>
        </div>
      </div>
    );
  };

  // Render the apply view when in apply mode
  const renderApplyView = () => {
    if (!selectedEntity) return null;

    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-background p-4">
          <h3 className="mb-2 text-base font-medium">Ready to Apply</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Click on slots in the timetable to apply{" "}
            <strong>{selectedEntity.name}</strong>.
          </p>

          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: selectedEntity.color }}
            >
              {selectedEntity.icon}
            </div>
            <div>
              <p className="font-medium">{selectedEntity.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedEntity.shortName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={resetState}>
            Choose Another {entityType === "subject" ? "Subject" : "Activity"}
          </Button>
        </div>
      </div>
    );
  };

  // Main render method
  return (
    <div className="space-y-4">
      <p className="text-sm text-sidebar-foreground/80 mb-4">
        Choose a subject or activity, customize it, and apply it to slots in
        your timetable.
      </p>

      {mode === "choose" && (
        <Tabs
          defaultValue={entityType}
          onValueChange={(value) =>
            setEntityType(value as "subject" | "activity")
          }
        >
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="subject" className="flex-1">
              Subjects
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subject">
            <ChooseSubject
              onSelect={(subject) => handleEntitySelect(subject)}
            />
          </TabsContent>

          <TabsContent value="activity">
            <ChooseActivity
              onSelect={(activity) => handleEntitySelect(activity)}
            />
          </TabsContent>
        </Tabs>
      )}

      {mode === "customize" && renderCustomizeView()}

      {mode === "apply" && renderApplyView()}
    </div>
  );
}
