"use client";

import { type Activity, type Subject } from "@/lib/common-types";
import {
  getScheduleEntry,
  getTimeTableData,
  saveTimeTableData,
  updateScheduleEntry,
  type TimeTableData,
} from "@/lib/timetable";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

type TimetableContextType = {
  timetableData: TimeTableData | null;
  isLoading: boolean;
  selectedEntityId: string;
  entityType: "subject" | "activity";
  setSelectedEntityId: (id: string) => void;
  setEntityType: (type: "subject" | "activity") => void;
  addToTimetableSlot: (dayId: number, timeSlotId: number) => void;
  addNewEntity: (name: string, type: "subject" | "activity") => string;
  updateEntityColor: (
    entityId: string,
    type: "subject" | "activity",
    color: string
  ) => void;
  updateEntityIcon: (
    entityId: string,
    type: "subject" | "activity",
    icon: string
  ) => void;
  updateEntityShortName: (
    entityId: string,
    type: "subject" | "activity",
    shortName: string
  ) => void;
  activeTag: "récréation" | "pause" | null;
  setActiveTag: (tag: "récréation" | "pause" | null) => void;
  isTagModeActive: boolean;
  setIsTagModeActive: (active: boolean) => void;
  splitTimetableSlot: (
    dayId: number,
    timeSlotId: number,
    weekAEntityId: string,
    weekBEntityId: string
  ) => void;
};

const TimetableContext = createContext<TimetableContextType | undefined>(
  undefined
);

export function TimetableProvider({ children }: { children: ReactNode }) {
  const [timetableData, setTimetableData] = useState<TimeTableData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [entityType, setEntityType] = useState<"subject" | "activity">(
    "subject"
  );
  const [activeTag, setActiveTag] = useState<"récréation" | "pause" | null>(
    null
  );
  const [isTagModeActive, setIsTagModeActive] = useState(false);
  const [showWeekSplitDialog, setShowWeekSplitDialog] = useState(false);
  const [pendingSlotAction, setPendingSlotAction] = useState<{
    dayId: number;
    timeSlotId: number;
  } | null>(null);

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
    window.addEventListener("timetableDataChanged", handleStorageChange);

    // Refresh data every 2 seconds to catch any localStorage changes
    const intervalId = setInterval(() => {
      const updatedData = getTimeTableData();
      setTimetableData(updatedData);
    }, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("timetableDataChanged", handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const addToTimetableSlot = (dayId: number, timeSlotId: number) => {
    if (!timetableData) {
      console.log("Cannot add to timetable: no data");
      return;
    }

    // Check if we're in tag mode
    if (activeTag && isTagModeActive) {
      console.log("Adding tag to timetable slot:", {
        dayId,
        timeSlotId,
        tag: activeTag,
      });

      const updatedData = updateScheduleEntry(
        timetableData,
        dayId,
        timeSlotId,
        {
          type: "",
          entityId: "",
          tag: activeTag,
        }
      );

      setTimetableData(updatedData);

      // Trigger a custom event to notify of timetable data change
      window.dispatchEvent(new Event("timetableDataChanged"));
      return;
    }

    // Normal entity mode
    if (!selectedEntityId) {
      console.log("Cannot add to timetable: no selected entity");
      return;
    }

    // Check if the slot is already occupied
    const existingEntry = getScheduleEntry(timetableData, dayId, timeSlotId);
    if (
      existingEntry &&
      existingEntry.entityId &&
      existingEntry.entityId !== selectedEntityId
    ) {
      // Store the pending action for later use
      setPendingSlotAction({ dayId, timeSlotId });

      // Trigger the week split dialog via a custom event
      window.dispatchEvent(
        new CustomEvent("showWeekSplitDialog", {
          detail: {
            dayId,
            timeSlotId,
            existingEntityId: existingEntry.entityId,
            newEntityId: selectedEntityId,
          },
        })
      );
      return;
    }

    console.log("Adding to timetable slot:", {
      dayId,
      timeSlotId,
      entityType,
      selectedEntityId,
    });

    const updatedData = updateScheduleEntry(timetableData, dayId, timeSlotId, {
      type: entityType,
      entityId: selectedEntityId,
      tag: null, // Clear any existing tag
    });

    setTimetableData(updatedData);

    // Trigger a custom event to notify of timetable data change
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  const splitTimetableSlot = (
    dayId: number,
    timeSlotId: number,
    weekAEntityId: string,
    weekBEntityId: string
  ) => {
    if (!timetableData) {
      console.log("Cannot split timetable slot: no data");
      return;
    }

    console.log("Splitting timetable slot:", {
      dayId,
      timeSlotId,
      weekAEntityId,
      weekBEntityId,
    });

    // Get the existing entry to preserve other properties
    const existingEntry = getScheduleEntry(timetableData, dayId, timeSlotId);
    if (!existingEntry) return;

    // Update the entry with week A/B split
    const updatedData = updateScheduleEntry(timetableData, dayId, timeSlotId, {
      type: entityType,
      entityId: weekAEntityId,
      weekType: "A",
      split: {
        enabled: true,
        entityIdB: weekBEntityId,
        roomB: existingEntry.room,
        notes: existingEntry.notes,
      },
    });

    setTimetableData(updatedData);
    toast.success("Créneau divisé en semaine A/B");

    // Trigger a custom event to notify of timetable data change
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  // Helper function to generate short name from full name
  const generateShortName = (name: string): string => {
    if (name.length <= 10) return name;

    const words = name.split(" ");
    if (words.length > 1) {
      return words.map((word) => word[0]).join("");
    }

    return name.slice(0, 6);
  };

  // Colors for new entities
  const colors = [
    "#3498db",
    "#e74c3c",
    "#2ecc71",
    "#f1c40f",
    "#9b59b6",
    "#e67e22",
    "#1abc9c",
    "#95a5a6",
    "#34495e",
  ];

  const addNewEntity = (name: string, type: "subject" | "activity"): string => {
    if (!timetableData || !name) return "";

    const newData = structuredClone(timetableData);
    let newId = "";

    if (type === "subject") {
      newId = `s-${newData.subjects.length + 1}`;
      const shortName = generateShortName(name);
      const colorIndex = newData.subjects.length % colors.length;

      const newSubject: Subject = {
        id: newId,
        name,
        shortName,
        color: colors[colorIndex],
        icon: "📘", // Default icon
        teachers: [],
      };

      newData.subjects.push(newSubject);
    } else {
      newId = `a-${newData.activities.length + 1}`;
      const shortName = generateShortName(name);
      const colorIndex = newData.activities.length % colors.length;

      const newActivity: Activity = {
        id: newId,
        name,
        shortName,
        color: colors[colorIndex],
        icon: "📋", // Default icon
      };

      newData.activities.push(newActivity);
    }

    saveTimeTableData(newData);
    setTimetableData(newData);

    return newId;
  };

  const updateEntityColor = (
    entityId: string,
    type: "subject" | "activity",
    color: string
  ) => {
    if (!timetableData || !entityId) return;

    const newData = structuredClone(timetableData);

    if (type === "subject") {
      const subjectIndex = newData.subjects.findIndex((s) => s.id === entityId);
      if (subjectIndex !== -1) {
        newData.subjects[subjectIndex].color = color;
      }
    } else {
      const activityIndex = newData.activities.findIndex(
        (a) => a.id === entityId
      );
      if (activityIndex !== -1) {
        newData.activities[activityIndex].color = color;
      }
    }

    saveTimeTableData(newData);
    setTimetableData(newData);

    // Trigger a custom event to notify of timetable data change
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  const updateEntityIcon = (
    entityId: string,
    type: "subject" | "activity",
    icon: string
  ) => {
    if (!timetableData || !entityId) return;

    const newData = structuredClone(timetableData);

    if (type === "subject") {
      const subjectIndex = newData.subjects.findIndex((s) => s.id === entityId);
      if (subjectIndex !== -1) {
        newData.subjects[subjectIndex].icon = icon;
      }
    } else {
      const activityIndex = newData.activities.findIndex(
        (a) => a.id === entityId
      );
      if (activityIndex !== -1) {
        newData.activities[activityIndex].icon = icon;
      }
    }

    saveTimeTableData(newData);
    setTimetableData(newData);

    // Trigger a custom event to notify of timetable data change
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  const updateEntityShortName = (
    entityId: string,
    type: "subject" | "activity",
    shortName: string
  ) => {
    if (!timetableData || !entityId) return;

    const newData = structuredClone(timetableData);

    if (type === "subject") {
      const subjectIndex = newData.subjects.findIndex((s) => s.id === entityId);
      if (subjectIndex !== -1) {
        newData.subjects[subjectIndex].shortName = shortName;
      }
    } else {
      const activityIndex = newData.activities.findIndex(
        (a) => a.id === entityId
      );
      if (activityIndex !== -1) {
        newData.activities[activityIndex].shortName = shortName;
      }
    }

    saveTimeTableData(newData);
    setTimetableData(newData);

    // Trigger a custom event to notify of timetable data change
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  const value = {
    timetableData,
    isLoading,
    selectedEntityId,
    entityType,
    setSelectedEntityId,
    setEntityType,
    addToTimetableSlot,
    addNewEntity,
    updateEntityColor,
    updateEntityIcon,
    updateEntityShortName,
    activeTag,
    setActiveTag,
    isTagModeActive,
    setIsTagModeActive,
    splitTimetableSlot,
  };

  return (
    <TimetableContext.Provider value={value}>
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const context = useContext(TimetableContext);
  if (context === undefined) {
    throw new Error("useTimetable must be used within a TimetableProvider");
  }
  return context;
}
