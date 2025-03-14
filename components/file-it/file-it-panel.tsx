"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Activity, type Subject } from "@/lib/common-types";
import {
  getTimeTableData,
  saveTimeTableData,
  updateScheduleEntry,
  type TimeTableData,
} from "@/lib/timetable";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Custom event for timetable slot selection
declare global {
  interface WindowEventMap {
    timetableSlotSelected: CustomEvent<{ dayId: number; timeSlotId: number }>;
  }
}

export function FileItPanel() {
  const [timetableData, setTimetableData] = useState<TimeTableData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [entityType, setEntityType] = useState<"subject" | "activity">(
    "subject"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [showAddNew, setShowAddNew] = useState(false);

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

    // Listen for timetable slot selection events
    const handleSlotSelection = (
      event: CustomEvent<{ dayId: number; timeSlotId: number }>
    ) => {
      const { dayId, timeSlotId } = event.detail;
      if (selectedEntityId) {
        addToTimetableSlot(dayId, timeSlotId);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("timetableDataChanged", handleStorageChange);
    window.addEventListener("timetableSlotSelected", handleSlotSelection);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("timetableDataChanged", handleStorageChange);
      window.removeEventListener("timetableSlotSelected", handleSlotSelection);
    };
  }, [selectedEntityId]);

  useEffect(() => {
    // Reset search when entity type changes
    setSearchTerm("");
    setSelectedEntityId("");
    setShowAddNew(false);
  }, [entityType]);

  useEffect(() => {
    // Check if search term matches any existing entities
    if (searchTerm && timetableData) {
      const entities =
        entityType === "subject"
          ? timetableData.subjects
          : timetableData.activities;

      const matchingEntity = entities.find((entity) =>
        entity.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (!matchingEntity && searchTerm.length > 2) {
        setShowAddNew(true);
      } else {
        setShowAddNew(false);
      }
    } else {
      setShowAddNew(false);
    }
  }, [searchTerm, entityType, timetableData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedEntityId("");
  };

  const handleEntitySelect = (id: string) => {
    setSelectedEntityId(id);
    setSearchTerm("");
    setShowAddNew(false);
  };

  const handleAddNewEntity = () => {
    if (!timetableData || !searchTerm) return;

    const newData = structuredClone(timetableData);

    if (entityType === "subject") {
      const newId = `s-${newData.subjects.length + 1}`;
      const shortName = generateShortName(searchTerm);
      const colorIndex = newData.subjects.length % colors.length;

      const newSubject: Subject = {
        id: newId,
        name: searchTerm,
        shortName,
        color: colors[colorIndex],
        icon: "📘", // Default icon
        teachers: [],
      };

      newData.subjects.push(newSubject);
      setSelectedEntityId(newId);
    } else {
      const newId = `a-${newData.activities.length + 1}`;
      const shortName = generateShortName(searchTerm);
      const colorIndex = newData.activities.length % colors.length;

      const newActivity: Activity = {
        id: newId,
        name: searchTerm,
        shortName,
        color: colors[colorIndex],
        icon: "📋", // Default icon
      };

      newData.activities.push(newActivity);
      setSelectedEntityId(newId);
    }

    saveTimeTableData(newData);
    setTimetableData(newData);
    setSearchTerm("");
    setShowAddNew(false);

    toast.success(
      `Nouvelle ${entityType === "subject" ? "matière" : "activité"} ajoutée`
    );
  };

  const addToTimetableSlot = (dayId: number, timeSlotId: number) => {
    if (!timetableData || !selectedEntityId) return;

    const updatedData = updateScheduleEntry(timetableData, dayId, timeSlotId, {
      type: entityType,
      entityId: selectedEntityId,
    });

    setTimetableData(updatedData);
    toast.success("Ajouté à l'emploi du temps");
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

  const filteredEntities =
    timetableData && searchTerm
      ? (entityType === "subject"
          ? timetableData.subjects
          : timetableData.activities
        ).filter((entity) =>
          entity.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];

  if (isLoading || !timetableData) {
    return (
      <div className="p-4 flex items-center justify-center h-[200px]">
        <div className="animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-medium">Choisir une matière ou activité</h3>

      <div className="flex gap-2">
        <Button
          variant={entityType === "subject" ? "default" : "outline"}
          onClick={() => setEntityType("subject")}
          className="flex-1"
        >
          Matière
        </Button>
        <Button
          variant={entityType === "activity" ? "default" : "outline"}
          onClick={() => setEntityType("activity")}
          className="flex-1"
        >
          Activité
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          placeholder={`Rechercher une ${
            entityType === "subject" ? "matière" : "activité"
          }...`}
          value={searchTerm}
          onChange={handleSearchChange}
        />

        {searchTerm && filteredEntities.length > 0 && (
          <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
            {filteredEntities.map((entity) => (
              <div
                key={entity.id}
                className={`p-2 cursor-pointer rounded hover:bg-muted ${
                  selectedEntityId === entity.id ? "bg-muted" : ""
                }`}
                onClick={() => handleEntitySelect(entity.id)}
              >
                {entity.name}
              </div>
            ))}
          </div>
        )}

        {showAddNew && (
          <div className="mt-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleAddNewEntity}
            >
              + Ajouter &quot;{searchTerm}&quot; comme nouvelle{" "}
              {entityType === "subject" ? "matière" : "activité"}
            </Button>
          </div>
        )}

        {selectedEntityId && (
          <div className="mt-4 p-3 border rounded-md bg-muted/30">
            <p className="font-medium mb-2">
              {entityType === "subject" ? "Matière" : "Activité"} sélectionnée:
            </p>
            <p>
              {entityType === "subject"
                ? timetableData.subjects.find((s) => s.id === selectedEntityId)
                    ?.name
                : timetableData.activities.find(
                    (a) => a.id === selectedEntityId
                  )?.name}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Cliquez sur un créneau de l&apos;emploi du temps pour y ajouter
              cette {entityType === "subject" ? "matière" : "activité"}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
