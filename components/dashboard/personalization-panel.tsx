"use client";

import { IconPicker } from "@/components/file-it/icon-picker";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveTimeTableData } from "@/lib/timetable";
import { useTimetable } from "@/lib/timetable-context";
import { Paintbrush, Palette, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Type for the selected cell
type SelectedCell = {
  dayId: number;
  timeSlotId: number;
} | null;

// Type for global customization settings
type GlobalSettings = {
  title: string;
  fontFamily: string;
  borderTheme: string;
};

// Default global settings
const defaultGlobalSettings: GlobalSettings = {
  title: "",
  fontFamily: "Inter",
  borderTheme: "none",
};

// Available font families
const fontFamilies = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Open Sans", label: "Open Sans" },
];

// Available border themes
const borderThemes = [
  { value: "none", label: "Aucun" },
  { value: "superhero", label: "Super-héros" },
  { value: "space", label: "Espace" },
  { value: "nature", label: "Nature" },
  { value: "solid-color", label: "Couleur uniforme" },
];

export function PersonalizationPanel({
  selectedCell,
  onCellDeselect,
}: {
  selectedCell: SelectedCell;
  onCellDeselect: () => void;
}) {
  const { timetableData, updateEntityColor, updateEntityIcon } = useTimetable();
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(
    defaultGlobalSettings
  );
  const [teacherName, setTeacherName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3498db");
  const [selectedIcon, setSelectedIcon] = useState("📚");
  const [currentEntityId, setCurrentEntityId] = useState<string | null>(null);
  const [subjectTeachers, setSubjectTeachers] = useState<
    Record<string, string>
  >({});
  const [isWeekSplit, setIsWeekSplit] = useState(false);
  const [weekType, setWeekType] = useState<"A" | "B" | null>(null);
  const [entityIdB, setEntityIdB] = useState<string | null>(null);
  const [roomNumberB, setRoomNumberB] = useState("");

  // Flags to track if inputs have been modified by user
  const [titleModified, setTitleModified] = useState(false);
  const [teacherNameModified, setTeacherNameModified] = useState(false);
  const [roomNumberModified, setRoomNumberModified] = useState(false);
  const [iconModified, setIconModified] = useState(false);

  // Refs to track previous values
  const prevSelectedCellRef = useRef<SelectedCell>(null);
  const teacherTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved global settings on mount only
  useEffect(() => {
    const savedSettings = localStorage.getItem("timetableGlobalSettings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Only update if title hasn't been modified
      if (!titleModified) {
        setGlobalSettings(parsedSettings);
      } else {
        // If title has been modified, keep the current title but update other settings
        setGlobalSettings((prev) => ({
          ...parsedSettings,
          title: prev.title,
        }));
      }
    }

    // Load saved subject teachers
    const savedTeachers = localStorage.getItem("subjectTeachers");
    if (savedTeachers) {
      setSubjectTeachers(JSON.parse(savedTeachers));
    }

    // Cleanup timeouts on unmount
    return () => {
      if (teacherTimeoutRef.current) {
        clearTimeout(teacherTimeoutRef.current);
      }
      if (roomTimeoutRef.current) {
        clearTimeout(roomTimeoutRef.current);
      }
    };
  }, [titleModified]);

  // Reset modification flags when cell selection changes
  useEffect(() => {
    if (selectedCell !== prevSelectedCellRef.current) {
      setTeacherNameModified(false);
      setRoomNumberModified(false);
      setIconModified(false);
      prevSelectedCellRef.current = selectedCell;
    }
  }, [selectedCell]);

  // Load cell data when a cell is selected
  useEffect(() => {
    if (!selectedCell || !timetableData) {
      return;
    }

    const { dayId, timeSlotId } = selectedCell;
    const entry = timetableData.schedule.find(
      (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
    );

    if (!entry) {
      setTeacherName("");
      setRoomNumber("");
      setCurrentEntityId(null);
      setIsWeekSplit(false);
      setWeekType(null);
      setEntityIdB(null);
      setRoomNumberB("");
      return;
    }

    // Set current entity ID
    setCurrentEntityId(entry.entityId);

    // Update color and icon based on the selected entity
    if (entry.entityId) {
      const entity =
        timetableData.subjects.find((s) => s.id === entry.entityId) ||
        timetableData.activities.find((a) => a.id === entry.entityId);
      if (entity) {
        setSelectedColor(entity.color || "#3498db");
        setSelectedIcon(entity.icon || "📚");
      }
    }

    // Set room number
    setRoomNumber(entry.room || "");

    // Set teacher name from notes
    if (entry.notes) {
      const teacherLine = entry.notes
        .split("\n")
        .find((line) => line.startsWith("Professeur:"));
      if (teacherLine) {
        setTeacherName(teacherLine.replace("Professeur:", "").trim());
      } else {
        setTeacherName("");
      }
    } else {
      setTeacherName("");
    }

    // Set week split information
    setIsWeekSplit(entry.split?.enabled || false);
    setWeekType(entry.weekType as "A" | "B" | null);
    setEntityIdB(entry.split?.entityIdB || null);
    setRoomNumberB(entry.split?.roomB || "");

    // Reset modification flags
    setTeacherNameModified(false);
    setRoomNumberModified(false);
    setTitleModified(false);
    setIconModified(false);

    // Set previous selected cell
    prevSelectedCellRef.current = selectedCell;
  }, [selectedCell, timetableData]);

  // Save global settings
  const saveGlobalSettings = () => {
    localStorage.setItem(
      "timetableGlobalSettings",
      JSON.stringify(globalSettings)
    );

    // Apply settings to the DOM for immediate effect
    document.documentElement.style.setProperty(
      "--timetable-border-theme",
      globalSettings.borderTheme
    );

    // Reset modification flag
    setTitleModified(false);
  };

  // Handle teacher name change
  const handleTeacherNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTeacherName(newValue);
    setTeacherNameModified(true);

    // Clear previous timeout if it exists
    if (teacherTimeoutRef.current) {
      clearTimeout(teacherTimeoutRef.current);
    }

    // Apply changes immediately for better user experience
    if (currentEntityId && timetableData && selectedCell) {
      const { dayId, timeSlotId } = selectedCell;
      const updatedData = structuredClone(timetableData);
      const entry = updatedData.schedule.find(
        (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
      );

      if (entry) {
        let notes = entry.notes || "";

        // Remove existing teacher info if present
        notes = notes.replace(/Professeur:\s*.+?(?:\n|$)/, "");

        // Add teacher info only if there's a value
        if (newValue) {
          notes = `Professeur: ${newValue}\n${notes}`;
        }

        entry.notes = notes.trim();

        // Save the updated timetable data
        saveTimeTableData(updatedData);

        // Trigger a custom event to notify of timetable data change
        window.dispatchEvent(new Event("timetableDataChanged"));
      }
    }

    // Apply changes to all instances after a delay
    teacherTimeoutRef.current = setTimeout(() => {
      if (currentEntityId && timetableData) {
        // Apply to all instances of this subject, even if value is empty
        applyTeacherToAllInstances(newValue);

        // Only save to subjectTeachers if there's a value
        if (newValue) {
          const updatedTeachers = {
            ...subjectTeachers,
            [currentEntityId]: newValue,
          };
          setSubjectTeachers(updatedTeachers);
          localStorage.setItem(
            "subjectTeachers",
            JSON.stringify(updatedTeachers)
          );
        } else {
          // Remove from subjectTeachers if empty
          const updatedTeachers = { ...subjectTeachers };
          delete updatedTeachers[currentEntityId];
          setSubjectTeachers(updatedTeachers);
          localStorage.setItem(
            "subjectTeachers",
            JSON.stringify(updatedTeachers)
          );
        }
      }
    }, 1000); // Increased delay to 1 second
  };

  // Handle room number change
  const handleRoomNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setRoomNumber(newValue);
    setRoomNumberModified(true);

    // Clear previous timeout if it exists
    if (roomTimeoutRef.current) {
      clearTimeout(roomTimeoutRef.current);
    }

    // Apply changes immediately for better user experience
    if (currentEntityId && timetableData && selectedCell) {
      const { dayId, timeSlotId } = selectedCell;
      const updatedData = structuredClone(timetableData);
      const entry = updatedData.schedule.find(
        (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
      );

      if (entry) {
        entry.room = newValue;

        // Save the updated timetable data
        saveTimeTableData(updatedData);

        // Trigger a custom event to notify of timetable data change
        window.dispatchEvent(new Event("timetableDataChanged"));
      }
    }

    // Apply changes to all instances after a delay
    roomTimeoutRef.current = setTimeout(() => {
      if (currentEntityId && timetableData) {
        // Apply to all instances of this subject, even if value is empty
        applyRoomToAllInstances(newValue);
      }
    }, 1000); // Increased delay to 1 second
  };

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalSettings({
      ...globalSettings,
      title: e.target.value,
    });
    setTitleModified(true);
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    setSelectedColor(color);

    // Apply color change immediately if we have an entity selected
    if (currentEntityId && timetableData) {
      const entityType = currentEntityId.startsWith("s-")
        ? "subject"
        : "activity";
      updateEntityColor(currentEntityId, entityType, color);
    }
  };

  // Apply teacher to all instances of this subject (now private helper function)
  const applyTeacherToAllInstances = (teacherValue = teacherName) => {
    if (!timetableData || !currentEntityId) return;

    // Check if the teacher value has actually changed for this entity
    if (teacherValue && subjectTeachers[currentEntityId] === teacherValue) {
      // No change, no need to update
      return;
    }

    const updatedData = { ...timetableData };
    let changesMade = false;

    // Update all schedule entries with this entity ID
    updatedData.schedule = updatedData.schedule.map((entry) => {
      if (entry.entityId === currentEntityId) {
        let notes = entry.notes || "";

        // Remove existing teacher info if present
        notes = notes.replace(/Professeur:\s*.+?(?:\n|$)/, "");

        // Add teacher info only if there's a value
        if (teacherValue) {
          notes = `Professeur: ${teacherValue}\n${notes}`;
        }

        changesMade = true;

        return {
          ...entry,
          notes: notes.trim(),
        };
      }
      return entry;
    });

    if (changesMade) {
      // Save the updated timetable data
      saveTimeTableData(updatedData);

      // Trigger a custom event to notify of timetable data change
      window.dispatchEvent(new Event("timetableDataChanged"));
    }
  };

  // Apply room to all instances of this subject
  const applyRoomToAllInstances = (roomValue = roomNumber) => {
    if (!timetableData || !currentEntityId) return;

    // Check if any entry with this entity ID already has this room value
    const needsUpdate = timetableData.schedule.some(
      (entry) => entry.entityId === currentEntityId && entry.room !== roomValue
    );

    if (!needsUpdate) {
      // No change needed
      return;
    }

    const updatedData = { ...timetableData };
    let changesMade = false;

    // Update all schedule entries with this entity ID
    updatedData.schedule = updatedData.schedule.map((entry) => {
      if (entry.entityId === currentEntityId) {
        changesMade = true;
        return {
          ...entry,
          room: roomValue, // This will be empty string if roomValue is empty
        };
      }
      return entry;
    });

    if (changesMade) {
      // Save the updated timetable data
      saveTimeTableData(updatedData);

      // Trigger a custom event to notify of timetable data change
      window.dispatchEvent(new Event("timetableDataChanged"));
    }
  };

  // Handle week split toggle
  const handleWeekSplitToggle = (enabled: boolean) => {
    if (!selectedCell || !timetableData) return;

    const { dayId, timeSlotId } = selectedCell;
    const updatedData = structuredClone(timetableData);
    const entry = updatedData.schedule.find(
      (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
    );

    if (!entry) return;

    if (enabled) {
      // Enable week split
      entry.weekType = "A";
      entry.split = {
        enabled: true,
        entityIdB: entry.entityId, // Default to same entity
        roomB: entry.room,
        notes: entry.notes,
      };
    } else {
      // Disable week split
      entry.weekType = null;
      entry.split = {
        enabled: false,
      };
    }

    setIsWeekSplit(enabled);
    setWeekType(enabled ? "A" : null);
    setEntityIdB(enabled ? entry.entityId : null);
    setRoomNumberB(enabled ? entry.room : "");

    saveTimeTableData(updatedData);
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  // Handle week type change
  const handleWeekTypeChange = (type: "A" | "B") => {
    if (!selectedCell || !timetableData) return;

    const { dayId, timeSlotId } = selectedCell;
    const updatedData = structuredClone(timetableData);
    const entry = updatedData.schedule.find(
      (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
    );

    if (!entry) return;

    entry.weekType = type;
    setWeekType(type);

    saveTimeTableData(updatedData);
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  // Handle entity B change
  const handleEntityBChange = (entityId: string) => {
    if (!selectedCell || !timetableData) return;

    const { dayId, timeSlotId } = selectedCell;
    const updatedData = structuredClone(timetableData);
    const entry = updatedData.schedule.find(
      (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
    );

    if (!entry || !entry.split) return;

    // Set entityIdB to empty string if "none" is selected
    entry.split.entityIdB = entityId === "none" ? "" : entityId;
    setEntityIdB(entityId === "none" ? null : entityId);

    saveTimeTableData(updatedData);
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  // Handle room B change
  const handleRoomBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setRoomNumberB(newValue);

    if (!selectedCell || !timetableData) return;

    const { dayId, timeSlotId } = selectedCell;
    const updatedData = structuredClone(timetableData);
    const entry = updatedData.schedule.find(
      (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
    );

    if (!entry || !entry.split) return;

    entry.split.roomB = newValue;

    saveTimeTableData(updatedData);
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="cell" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="cell">Créneau</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
        </TabsList>

        <TabsContent
          value="cell"
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {selectedCell ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="entity">Matière / Activité</Label>
                  <Select
                    value={currentEntityId || "none"}
                    onValueChange={(value) => {
                      if (!selectedCell || !timetableData) return;

                      const { dayId, timeSlotId } = selectedCell;
                      const updatedData = structuredClone(timetableData);
                      const entry = updatedData.schedule.find(
                        (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
                      );

                      if (!entry) return;

                      // Determine entity type
                      const isSubject = updatedData.subjects.some(
                        (s) => s.id === value
                      );
                      const entityType = isSubject ? "subject" : "activity";

                      // Set entityId to empty string if "none" is selected
                      entry.entityId = value === "none" ? "" : value;
                      entry.type = value === "none" ? "" : entityType;
                      setCurrentEntityId(value === "none" ? null : value);

                      saveTimeTableData(updatedData);
                      window.dispatchEvent(new Event("timetableDataChanged"));
                    }}
                  >
                    <SelectTrigger id="entity">
                      <SelectValue placeholder="Sélectionner une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {timetableData.subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.icon} {subject.name}
                        </SelectItem>
                      ))}
                      {timetableData.activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.icon} {activity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentEntityId && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Palette className="h-4 w-4" />
                      <span>Apparence</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cell-color">Couleur</Label>
                        <div className="flex items-center gap-2">
                          <ColorPicker
                            color={selectedColor}
                            onChange={handleColorChange}
                            onChangeComplete={() => {}}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cell-icon">Icône</Label>
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-10 h-10 p-0 flex items-center justify-center"
                              >
                                {selectedIcon ? (
                                  <span className="text-xl">
                                    {selectedIcon}
                                  </span>
                                ) : (
                                  <Palette className="h-4 w-4" />
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <IconPicker
                                selectedIcon={selectedIcon}
                                onSelectIcon={(icon) => {
                                  setSelectedIcon(icon);
                                  setIconModified(true);
                                  if (currentEntityId && timetableData) {
                                    const entityType =
                                      currentEntityId.startsWith("s-")
                                        ? "subject"
                                        : "activity";
                                    updateEntityIcon(
                                      currentEntityId,
                                      entityType,
                                      icon
                                    );
                                  }
                                }}
                                onClose={() => {}}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="room">Salle</Label>
                  <Input
                    id="room"
                    value={roomNumber}
                    onChange={handleRoomNumberChange}
                    placeholder="Ex: B305"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher">Professeur</Label>
                  <Input
                    id="teacher"
                    value={teacherName}
                    onChange={handleTeacherNameChange}
                    placeholder="Ex: M. Dupont"
                  />
                </div>

                {/* Week A/B Split Section */}
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="week-split">Alternance semaine A/B</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="week-split"
                        checked={isWeekSplit}
                        onChange={(e) =>
                          handleWeekSplitToggle(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                  </div>

                  {isWeekSplit && (
                    <div className="space-y-4 pl-2 border-l-2 border-primary/20">
                      <div className="space-y-2">
                        <Label htmlFor="week-type">Type de semaine</Label>
                        <Select
                          value={weekType || "A"}
                          onValueChange={(value) =>
                            handleWeekTypeChange(value as "A" | "B")
                          }
                        >
                          <SelectTrigger id="week-type">
                            <SelectValue placeholder="Sélectionner le type de semaine" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">Semaine A</SelectItem>
                            <SelectItem value="B">Semaine B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="entity-b">
                          Matière semaine {weekType === "A" ? "B" : "A"}
                        </Label>
                        <Select
                          value={entityIdB || "none"}
                          onValueChange={handleEntityBChange}
                        >
                          <SelectTrigger id="entity-b">
                            <SelectValue
                              placeholder={`Sélectionner une matière pour la semaine ${
                                weekType === "A" ? "B" : "A"
                              }`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            {timetableData.subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.icon} {subject.name}
                              </SelectItem>
                            ))}
                            {timetableData.activities.map((activity) => (
                              <SelectItem key={activity.id} value={activity.id}>
                                {activity.icon} {activity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="room-b">
                          Salle semaine {weekType === "A" ? "B" : "A"}
                        </Label>
                        <Input
                          id="room-b"
                          value={roomNumberB}
                          onChange={handleRoomBChange}
                          placeholder={`Ex: B305 (semaine ${
                            weekType === "A" ? "B" : "A"
                          })`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Sélectionnez un créneau pour le personnaliser
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="global"
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personnalisation globale</h3>

            <Tabs defaultValue="typography">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="typography">
                  <Type className="h-4 w-4 mr-2" />
                  Typographie
                </TabsTrigger>
                <TabsTrigger value="title">
                  <Paintbrush className="h-4 w-4 mr-2" />
                  Titre
                </TabsTrigger>
                <TabsTrigger value="theme">
                  <Palette className="h-4 w-4 mr-2" />
                  Thème
                </TabsTrigger>
              </TabsList>

              <TabsContent value="typography" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="font-family">Police d&apos;écriture</Label>
                  <Select
                    value={globalSettings.fontFamily}
                    onValueChange={(value) =>
                      setGlobalSettings({
                        ...globalSettings,
                        fontFamily: value,
                      })
                    }
                  >
                    <SelectTrigger id="font-family">
                      <SelectValue placeholder="Sélectionnez une police" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="title" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="timetable-title">
                    Titre de l&apos;emploi du temps
                  </Label>
                  <Input
                    id="timetable-title"
                    value={globalSettings.title}
                    onChange={handleTitleChange}
                    placeholder="Entrez un titre pour votre emploi du temps"
                  />
                </div>
              </TabsContent>

              <TabsContent value="theme" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="border-theme">Thème de cadre</Label>
                  <Select
                    value={globalSettings.borderTheme}
                    onValueChange={(value) => {
                      setGlobalSettings({
                        ...globalSettings,
                        borderTheme: value,
                      });
                      // Apply theme change immediately
                      document.documentElement.style.setProperty(
                        "--timetable-border-theme",
                        value
                      );
                    }}
                  >
                    <SelectTrigger id="border-theme">
                      <SelectValue placeholder="Sélectionnez un thème" />
                    </SelectTrigger>
                    <SelectContent>
                      {borderThemes.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-2">
                    Le thème de cadre ajoute une bordure décorative autour de
                    votre emploi du temps.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Button className="w-full" onClick={saveGlobalSettings}>
              Enregistrer les paramètres
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
