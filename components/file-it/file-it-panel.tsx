"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTimetable } from "@/lib/timetable-context";
import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { IconPicker } from "./icon-picker";

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
    updateEntityColor,
    updateEntityIcon,
    updateEntityShortName,
  } = useTimetable();

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [shortName, setShortName] = useState("");
  const [isEditingShortName, setIsEditingShortName] = useState(false);

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

  useEffect(() => {
    // Update selected color and shortName when entity changes
    if (selectedEntityId && timetableData) {
      const entity =
        entityType === "subject"
          ? timetableData.subjects.find((s) => s.id === selectedEntityId)
          : timetableData.activities.find((a) => a.id === selectedEntityId);

      if (entity) {
        setSelectedColor(entity.color);
        setShortName(entity.shortName);
      }
    }
  }, [selectedEntityId, entityType, timetableData]);

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

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
  };

  const handleColorChangeComplete = () => {
    if (selectedEntityId && timetableData) {
      updateEntityColor(selectedEntityId, entityType, selectedColor);
      setColorPickerOpen(false);
    }
  };

  const handleIconSelect = (icon: string) => {
    if (selectedEntityId && timetableData) {
      updateEntityIcon(selectedEntityId, entityType, icon);
      setIconPickerOpen(false);
    }
  };

  const handleShortNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShortName(e.target.value);
  };

  const handleShortNameSave = () => {
    if (selectedEntityId && timetableData && shortName.trim()) {
      updateEntityShortName(selectedEntityId, entityType, shortName.trim());
      setIsEditingShortName(false);
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

  const selectedEntity = selectedEntityId
    ? entityType === "subject"
      ? timetableData.subjects.find((s) => s.id === selectedEntityId)
      : timetableData.activities.find((a) => a.id === selectedEntityId)
    : null;

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
                } flex items-center`}
                onClick={() => handleEntitySelect(entity.id)}
              >
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: entity.color }}
                />
                <span className="mr-2">{entity.icon}</span>
                <span className="mr-2 text-xs text-muted-foreground">
                  {entity.shortName}
                </span>
                <span>{entity.name}</span>
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

        {selectedEntityId && selectedEntity && (
          <div className="mt-4 p-3 border rounded-md bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">
                {entityType === "subject" ? "Matière" : "Activité"}{" "}
                sélectionnée:
              </p>
              <div className="flex items-center gap-2">
                <Popover
                  open={colorPickerOpen}
                  onOpenChange={setColorPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer"
                      style={{ backgroundColor: selectedColor }}
                      aria-label="Changer la couleur"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="space-y-3">
                      <HexColorPicker
                        color={selectedColor}
                        onChange={handleColorChange}
                      />
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={handleColorChangeComplete}
                      >
                        Appliquer
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-xl border rounded cursor-pointer hover:bg-muted"
                      aria-label="Changer l'icône"
                    >
                      {selectedEntity.icon}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <IconPicker
                      selectedIcon={selectedEntity.icon}
                      onSelectIcon={handleIconSelect}
                      onClose={() => setIconPickerOpen(false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-center mb-3">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: selectedEntity.color }}
              />
              <span className="mr-2">{selectedEntity.icon}</span>
              <p>{selectedEntity.name}</p>
            </div>

            <div className="mb-3">
              {isEditingShortName ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Abréviation:</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingShortName(false)}
                      className="h-6 px-2"
                    >
                      Annuler
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={shortName}
                      onChange={handleShortNameChange}
                      placeholder="Abréviation"
                      maxLength={10}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={handleShortNameSave}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Abréviation:</label>
                  <div className="flex-1 p-2 bg-muted/50 rounded text-sm">
                    {selectedEntity.shortName}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingShortName(true)}
                    className="h-6 px-2 shrink-0"
                  >
                    Modifier
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                L&apos;abréviation est utilisée dans l&apos;emploi du temps pour
                économiser de l&apos;espace.
              </p>
            </div>

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
