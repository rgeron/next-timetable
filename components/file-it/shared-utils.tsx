"use client";

import { generateUniqueId } from "@/lib/file-it-data";
import { getTimeTableData, saveTimeTableData } from "@/lib/timetable";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

export function useSearch<T extends { name: string }>(items: T[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, searchQuery]);

  return { searchQuery, setSearchQuery, filteredItems };
}

export function useSelection<T>(initialSelectedItem?: T) {
  const [selectedItem, setSelectedItem] = useState<T | undefined>(
    initialSelectedItem
  );

  const handleSelect = useCallback((item: T) => {
    setSelectedItem(item);
  }, []);

  return { selectedItem, setSelectedItem, handleSelect };
}

export function useTimeTableUpdater() {
  const addSubjectToTimeTable = useCallback(
    (
      subjectData: Omit<import("@/lib/timetable").Subject, "id" | "teachers">
    ) => {
      const timeTableData = getTimeTableData();

      // Create a new subject with a unique ID
      const newSubject = {
        ...subjectData,
        id: generateUniqueId("s"),
        teachers: [],
      };

      // Add the subject to the timetable
      const updatedData = {
        ...timeTableData,
        subjects: [...timeTableData.subjects, newSubject],
      };

      saveTimeTableData(updatedData);
      toast.success(`Added ${subjectData.name} to your timetable`);
      return newSubject;
    },
    []
  );

  const addActivityToTimeTable = useCallback(
    (activityData: Omit<import("@/lib/timetable").Activity, "id">) => {
      const timeTableData = getTimeTableData();

      // Create a new activity with a unique ID
      const newActivity = {
        ...activityData,
        id: generateUniqueId("a"),
      };

      // Add the activity to the timetable
      const updatedData = {
        ...timeTableData,
        activities: [...timeTableData.activities, newActivity],
      };

      saveTimeTableData(updatedData);
      toast.success(`Added ${activityData.name} to your timetable`);
      return newActivity;
    },
    []
  );

  return { addSubjectToTimeTable, addActivityToTimeTable };
}
