"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AVAILABLE_ACTIVITIES, AVAILABLE_SUBJECTS } from "@/lib/file-it-data";
import {
  Activity,
  Subject,
  getTimeTableData,
  saveTimeTableData,
} from "@/lib/timetable";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChooseColor } from "./choose-color";
import { ChooseIcon } from "./choose-icon";
import { SearchInput } from "./search-input";
import { useSearch, useTimeTableUpdater } from "./shared-utils";

export function FileItSidebar() {
  // State for tracking which entity type is selected (subject or activity)
  const [entityType, setEntityType] = useState<"subject" | "activity">(
    "subject"
  );

  // Selected entity states
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );

  // Search states for subjects and activities
  const {
    searchQuery: subjectSearchQuery,
    setSearchQuery: setSubjectSearchQuery,
    filteredItems: filteredSubjects,
  } = useSearch(AVAILABLE_SUBJECTS);
  const {
    searchQuery: activitySearchQuery,
    setSearchQuery: setActivitySearchQuery,
    filteredItems: filteredActivities,
  } = useSearch(AVAILABLE_ACTIVITIES);

  // Custom color and icon when customizing
  const [customColor, setCustomColor] = useState<string | undefined>();
  const [customIcon, setCustomIcon] = useState<string | undefined>();

  // TimeTable updater
  const { addSubjectToTimeTable, addActivityToTimeTable } =
    useTimeTableUpdater();

  // Current selected entity (either subject or activity)
  const selectedEntity =
    entityType === "subject" ? selectedSubject : selectedActivity;

  // Apply selected entity and customization to timetable slot
  useEffect(() => {
    const handleTimeTableClick = (e: MouseEvent) => {
      // Only process clicks when we have a selected entity
      if (!selectedEntity) return;

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
  }, [selectedEntity]);

  // Apply the selected entity to a schedule entry
  const applyEntityToScheduleEntry = useCallback(
    (scheduleId: number) => {
      if (!selectedEntity) return;

      // Apply customizations first
      const updatedEntity = {
        ...selectedEntity,
        color: customColor || selectedEntity.color,
        icon: customIcon || selectedEntity.icon,
      };

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
        entityId: updatedEntity.id,
      };

      // Save the updated timetable
      saveTimeTableData({
        ...timeTableData,
        schedule: updatedSchedule,
      });

      // Trigger a custom event to refresh the timetable
      window.dispatchEvent(new Event("timetableDataChanged"));

      toast.success(`Applied ${updatedEntity.name} to the selected slot`);
    },
    [selectedEntity, customColor, customIcon, entityType]
  );

  // Handle selecting a subject
  const handleSelectSubject = useCallback(
    (subject: (typeof AVAILABLE_SUBJECTS)[0]) => {
      const newSubject = addSubjectToTimeTable(subject);
      setSelectedSubject(newSubject);
      setCustomColor(subject.color);
      setCustomIcon(subject.icon);
    },
    [addSubjectToTimeTable]
  );

  // Handle selecting an activity
  const handleSelectActivity = useCallback(
    (activity: (typeof AVAILABLE_ACTIVITIES)[0]) => {
      const newActivity = addActivityToTimeTable(activity);
      setSelectedActivity(newActivity);
      setCustomColor(activity.color);
      setCustomIcon(activity.icon);
    },
    [addActivityToTimeTable]
  );

  // Update the selected entity with new customizations
  const updateEntityCustomization = useCallback(() => {
    if (!selectedEntity) return;

    const timeTableData = getTimeTableData();

    if (entityType === "subject" && selectedSubject) {
      // Update subject
      const updatedSubjects = timeTableData.subjects.map((subject) =>
        subject.id === selectedSubject.id
          ? {
              ...subject,
              color: customColor || subject.color,
              icon: customIcon || subject.icon,
            }
          : subject
      );

      saveTimeTableData({
        ...timeTableData,
        subjects: updatedSubjects,
      });

      setSelectedSubject({
        ...selectedSubject,
        color: customColor || selectedSubject.color,
        icon: customIcon || selectedSubject.icon,
      });
    } else if (entityType === "activity" && selectedActivity) {
      // Update activity
      const updatedActivities = timeTableData.activities.map((activity) =>
        activity.id === selectedActivity.id
          ? {
              ...activity,
              color: customColor || activity.color,
              icon: customIcon || activity.icon,
            }
          : activity
      );

      saveTimeTableData({
        ...timeTableData,
        activities: updatedActivities,
      });

      setSelectedActivity({
        ...selectedActivity,
        color: customColor || selectedActivity.color,
        icon: customIcon || selectedActivity.icon,
      });
    }

    // Trigger a custom event to refresh the timetable
    window.dispatchEvent(new Event("timetableDataChanged"));
  }, [
    selectedEntity,
    entityType,
    selectedSubject,
    selectedActivity,
    customColor,
    customIcon,
  ]);

  // Apply customizations when they change
  useEffect(() => {
    if (selectedEntity) {
      updateEntityCustomization();
    }
  }, [customColor, customIcon, selectedEntity, updateEntityCustomization]);

  return (
    <div className="space-y-4">
      <p className="mb-4 text-sm text-sidebar-foreground/80">
        Select a subject or activity, customize it, and click on slots in your
        timetable to apply.
      </p>

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

        <TabsContent value="subject" className="space-y-4">
          <SearchInput
            searchQuery={subjectSearchQuery}
            setSearchQuery={setSubjectSearchQuery}
            placeholder="Search subjects..."
          />

          <div className="h-32 overflow-y-auto pr-1">
            {filteredSubjects.length > 0 ? (
              <div className="space-y-1">
                {filteredSubjects.map((subject) => (
                  <button
                    key={subject.name}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted/50"
                    onClick={() => handleSelectSubject(subject)}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.icon}
                    </div>
                    <span className="truncate">{subject.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No subjects found
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <SearchInput
            searchQuery={activitySearchQuery}
            setSearchQuery={setActivitySearchQuery}
            placeholder="Search activities..."
          />

          <div className="h-32 overflow-y-auto pr-1">
            {filteredActivities.length > 0 ? (
              <div className="space-y-1">
                {filteredActivities.map((activity) => (
                  <button
                    key={activity.name}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted/50"
                    onClick={() => handleSelectActivity(activity)}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                      style={{ backgroundColor: activity.color }}
                    >
                      {activity.icon}
                    </div>
                    <span className="truncate">{activity.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No activities found
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedEntity && (
        <div className="mt-4 space-y-4">
          <Card className="flex items-center gap-3 p-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
              style={{ backgroundColor: customColor || selectedEntity.color }}
            >
              {customIcon || selectedEntity.icon}
            </div>
            <div>
              <h3 className="text-sm font-medium">{selectedEntity.name}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedEntity.shortName} • Ready to apply
              </p>
            </div>
          </Card>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium">Color</h3>
              <div className="mt-2">
                <ChooseColor
                  selectedColor={customColor || selectedEntity.color}
                  onSelect={setCustomColor}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Icon</h3>
              <SearchInput
                searchQuery={iconSearchQuery}
                setSearchQuery={setIconSearchQuery}
                placeholder="Search icons..."
              />
              <div className="mt-2">
                <ChooseIcon
                  selectedIcon={customIcon || selectedEntity.icon}
                  onSelect={setCustomIcon}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
