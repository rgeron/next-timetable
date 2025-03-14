"use client";

import { type Activity, type Subject } from "@/lib/common-types";
import {
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
    if (!timetableData || !selectedEntityId) {
      console.log("Cannot add to timetable: no data or no selected entity");
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
    });

    setTimetableData(updatedData);

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
