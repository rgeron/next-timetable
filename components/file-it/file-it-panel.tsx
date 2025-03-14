"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTimetable } from "@/lib/timetable-context";
import { useEffect, useState } from "react";

// Custom event for timetable slot selection
declare global {
  interface WindowEventMap {
    timetableSlotSelected: CustomEvent<{ dayId: number; timeSlotId: number }>;
  }
}

export function FileItPanel() {
  const {
    timetableData,
    isLoading,
    selectedEntityId,
    entityType,
    setSelectedEntityId,
    setEntityType,
    addNewEntity,
  } = useTimetable();

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);

  useEffect(() => {
    // Reset search when entity type changes
    setSearchTerm("");
    setSelectedEntityId("");
    setShowAddNew(false);
  }, [entityType, setSelectedEntityId]);

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
    if (!searchTerm) return;

    const newId = addNewEntity(searchTerm, entityType);
    if (newId) {
      setSelectedEntityId(newId);
      setSearchTerm("");
      setShowAddNew(false);
    }
  };

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
