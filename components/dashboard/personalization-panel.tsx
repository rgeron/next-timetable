"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  borderColor: string;
  borderWidth: number;
};

// Default global settings
const defaultGlobalSettings: GlobalSettings = {
  title: "",
  fontFamily: "Inter",
  borderColor: "#e2e8f0",
  borderWidth: 1,
};

// Available font families
const fontFamilies = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Open Sans", label: "Open Sans" },
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
    if (savedSettings && !titleModified) {
      setGlobalSettings(JSON.parse(savedSettings));
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
      "--timetable-border-color",
      globalSettings.borderColor
    );
    document.documentElement.style.setProperty(
      "--timetable-border-width",
      `${globalSettings.borderWidth}px`
    );

    // Reset modification flag
    setTitleModified(false);
  };

  // Handle teacher name change
  const handleTeacherNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeacherName(e.target.value);
    setTeacherNameModified(true);

    // Clear previous timeout if it exists
    if (teacherTimeoutRef.current) {
      clearTimeout(teacherTimeoutRef.current);
    }

    // Apply changes automatically after a longer delay
    teacherTimeoutRef.current = setTimeout(() => {
      if (currentEntityId && timetableData) {
        // Apply to all instances of this subject, even if value is empty
        applyTeacherToAllInstances(e.target.value);

        // Only save to subjectTeachers if there's a value
        if (e.target.value) {
          const updatedTeachers = {
            ...subjectTeachers,
            [currentEntityId]: e.target.value,
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
    setRoomNumber(e.target.value);
    setRoomNumberModified(true);

    // Clear previous timeout if it exists
    if (roomTimeoutRef.current) {
      clearTimeout(roomTimeoutRef.current);
    }

    // Apply changes automatically after a longer delay
    roomTimeoutRef.current = setTimeout(() => {
      if (currentEntityId && timetableData) {
        // Apply to all instances of this subject, even if value is empty
        applyRoomToAllInstances(e.target.value);
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

  // Handle border color change
  const handleBorderColorChange = (color: string) => {
    setGlobalSettings({
      ...globalSettings,
      borderColor: color,
    });

    // Apply border color change immediately
    document.documentElement.style.setProperty(
      "--timetable-border-color",
      color
    );
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
        let notes = entry.notes;

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

    entry.split.entityIdB = entityId;
    setEntityIdB(entityId);

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
                    value={currentEntityId || ""}
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

                      entry.entityId = value;
                      entry.type = entityType;
                      setCurrentEntityId(value);

                      saveTimeTableData(updatedData);
                      window.dispatchEvent(new Event("timetableDataChanged"));
                    }}
                  >
                    <SelectTrigger id="entity">
                      <SelectValue placeholder="Sélectionner une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune</SelectItem>
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
                          value={entityIdB || ""}
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
                            <SelectItem value="">Aucune</SelectItem>
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

                {/* ... existing buttons ... */}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Sélectionnez un créneau pour le personnaliser
            </div>
          )}
        </TabsContent>

        {/* ... existing global tab ... */}
      </Tabs>
    </div>
  );
}
