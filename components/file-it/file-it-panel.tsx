"use client";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useTimetable } from "@/lib/timetable-context";
import { Eraser } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
    activeTag,
    setActiveTag,
    isTagModeActive,
    setIsTagModeActive,
  } = useTimetable();

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [shortName, setShortName] = useState("");
  const [isEditingShortName, setIsEditingShortName] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    // Reset search when entity type changes
    setSearchTerm("");
    setSelectedEntityId("");
    setShowAddNew(false);
    // Show the dropdown when switching between subject and activity
    setIsInputFocused(true);
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
        // Only update shortName if we're not currently editing it
        if (!isEditingShortName) {
          setShortName(entity.shortName);
        }
      }
    }
  }, [selectedEntityId, entityType, timetableData, isEditingShortName]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedEntityId("");
  };

  const handleInputFocus = () => {
    if (!eraserMode) {
      setIsInputFocused(true);
    }
  };

  const handleInputBlur = () => {
    // Use a small delay to allow click events on the dropdown items to fire first
    setTimeout(() => {
      setIsInputFocused(false);
    }, 200);
  };

  const handleEntitySelect = (id: string) => {
    setSelectedEntityId(id);
    setSearchTerm("");
    setShowAddNew(false);
    setEraserMode(false);
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

    // Apply color change immediately if we have an entity selected
    if (selectedEntityId && timetableData) {
      updateEntityColor(selectedEntityId, entityType, color);
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

      // Update the local state to match what we just saved
      const trimmedShortName = shortName.trim();
      setShortName(trimmedShortName);

      setIsEditingShortName(false);

      // Show success toast
      toast.success("Abréviation mise à jour");
    }
  };

  // Get all entities of the current type
  const allEntities = timetableData
    ? entityType === "subject"
      ? timetableData.subjects
      : timetableData.activities
    : [];

  // Filter entities based on search term if there is one
  const filteredEntities = searchTerm
    ? allEntities.filter((entity) =>
        entity.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allEntities;

  const toggleEraserMode = () => {
    setEraserMode(!eraserMode);
    setSelectedEntityId("");
    setSearchTerm("");
    setShowAddNew(false);
    setIsTagModeActive(false);
    setActiveTag(null);

    if (!eraserMode) {
      toast.info("Mode effaceur activé. Cliquez sur un créneau pour le vider.");
    } else {
      toast.info("Mode effaceur désactivé.");
    }
  };

  const handleQuickAction = (actionType: "récréation" | "pause") => {
    // Check if timetableData exists
    if (!timetableData) {
      toast.error("Données de l'emploi du temps non disponibles");
      return;
    }

    // Set tag mode
    setSelectedEntityId("");
    setEntityType("activity"); // Reset to activity type but we won't use it
    setEraserMode(false);
    setActiveTag(actionType);
    setIsTagModeActive(true);

    toast.success(
      `Mode "${actionType}" activé. Cliquez sur les créneaux pour ajouter "${actionType}".`
    );
  };

  // Add a custom event listener for timetable slot selection when in tag mode or eraser mode
  useEffect(() => {
    const handleSlotSelected = (
      event: CustomEvent<{ dayId: number; timeSlotId: number }>
    ) => {
      if (!timetableData) return;

      const { dayId, timeSlotId } = event.detail;
      const updatedData = structuredClone(timetableData);
      const entryIndex = updatedData.schedule.findIndex(
        (entry) => entry.dayId === dayId && entry.timeSlotId === timeSlotId
      );

      if (entryIndex === -1) return;

      // Handle eraser mode
      if (eraserMode) {
        updatedData.schedule[entryIndex].entityId = "";
        updatedData.schedule[entryIndex].type = "";
        updatedData.schedule[entryIndex].tag = null;

        // Save the updated data
        localStorage.setItem("timetable-data", JSON.stringify(updatedData));

        // Trigger a custom event to notify of timetable data change
        window.dispatchEvent(new Event("timetableDataChanged"));

        toast.success("Créneau effacé");
        return;
      }
    };

    window.addEventListener("timetableSlotSelected", handleSlotSelected);

    return () => {
      window.removeEventListener("timetableSlotSelected", handleSlotSelected);
    };
  }, [eraserMode, timetableData]);

  // Effect to reset tag mode when switching to eraser mode or selecting an entity
  useEffect(() => {
    if (eraserMode || selectedEntityId) {
      setIsTagModeActive(false);
    }
  }, [eraserMode, selectedEntityId, setIsTagModeActive]);

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
          onClick={() => {
            setEntityType("subject");
            setIsTagModeActive(false);
            setActiveTag(null);
          }}
          className="flex-1"
          disabled={eraserMode}
        >
          Matière
        </Button>
        <Button
          variant={entityType === "activity" ? "default" : "outline"}
          onClick={() => {
            setEntityType("activity");
            setIsTagModeActive(false);
            setActiveTag(null);
          }}
          className="flex-1"
          disabled={eraserMode}
        >
          Activité
        </Button>
        <Button
          variant={eraserMode ? "default" : "outline"}
          onClick={toggleEraserMode}
          className="w-10 h-10 p-0 flex items-center justify-center"
          title="Mode effaceur"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          placeholder={
            eraserMode
              ? "Mode effaceur activé"
              : `Rechercher une ${
                  entityType === "subject" ? "matière" : "activité"
                }...`
          }
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={eraserMode}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />

        {(isInputFocused || searchTerm) &&
          filteredEntities.length > 0 &&
          !eraserMode && (
            <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
              {filteredEntities.map((entity) => (
                <div
                  key={entity.id}
                  className={`p-2 cursor-pointer rounded hover:bg-muted ${
                    selectedEntityId === entity.id ? "bg-muted" : ""
                  } flex items-center gap-2`}
                  onClick={() => handleEntitySelect(entity.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entity.color }}
                  ></div>
                  <span className="text-lg">{entity.icon}</span>
                  <span className="flex-1">{entity.name}</span>
                  {entity.shortName && entity.shortName !== entity.name && (
                    <span className="text-xs text-muted-foreground">
                      ({entity.shortName})
                    </span>
                  )}
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

        {selectedEntityId && selectedEntity && !eraserMode && (
          <div className="mt-4 border rounded-lg shadow-sm overflow-hidden">
            <div
              className="p-3 flex items-center gap-3"
              style={{ backgroundColor: `${selectedColor}20` }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
                style={{ backgroundColor: selectedColor, color: "#fff" }}
              >
                {selectedEntity.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-base">{selectedEntity.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {entityType === "subject" ? "Matière" : "Activité"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ColorPicker
                  color={selectedColor}
                  onChange={handleColorChange}
                />
                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-lg border rounded-md cursor-pointer hover:bg-muted transition-colors"
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

            <div className="p-3 border-t">
              {isEditingShortName ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Abréviation</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Reset shortName to the current entity value
                        if (selectedEntity) {
                          setShortName(selectedEntity.shortName);
                        }
                        setIsEditingShortName(false);
                      }}
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
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Abréviation</div>
                    <div className="p-2 bg-muted/50 rounded-md text-sm">
                      {selectedEntity.shortName || "Non définie"}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingShortName(true)}
                    className="h-8 px-3 shrink-0 self-end"
                  >
                    Modifier
                  </Button>
                </div>
              )}
            </div>

            <div className="p-3 bg-muted/10 border-t flex items-center gap-2">
              <div
                className="w-1 h-8 rounded-full"
                style={{ backgroundColor: selectedColor }}
              ></div>
              <p className="text-sm text-muted-foreground">
                Cliquez sur un créneau de l&apos;emploi du temps pour y ajouter
                cette {entityType === "subject" ? "matière" : "activité"}.
              </p>
            </div>
          </div>
        )}

        {eraserMode && (
          <div className="mt-4 border rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 flex items-center gap-3 bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                <Eraser className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-base">Mode effaceur activé</h4>
              </div>
            </div>
            <div className="p-3 bg-muted/10 border-t flex items-center gap-2">
              <div className="w-1 h-8 rounded-full bg-red-400"></div>
              <p className="text-sm text-muted-foreground">
                Cliquez sur un créneau de l&apos;emploi du temps pour le vider.
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* Quick actions for break/recess - moved to bottom */}
      <div className="flex gap-2">
        <Button
          variant={
            activeTag === "récréation" && isTagModeActive
              ? "default"
              : "outline"
          }
          size="sm"
          className="flex-1"
          onClick={() => handleQuickAction("récréation")}
          disabled={eraserMode}
        >
          Récréation
        </Button>
        <Button
          variant={
            activeTag === "pause" && isTagModeActive ? "default" : "outline"
          }
          size="sm"
          className="flex-1"
          onClick={() => handleQuickAction("pause")}
          disabled={eraserMode}
        >
          Pause
        </Button>
      </div>
    </div>
  );
}
