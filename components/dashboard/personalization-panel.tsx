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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getScheduleEntry,
  saveTimeTableData,
  updateScheduleEntry,
} from "@/lib/timetable";
import { useTimetable } from "@/lib/timetable-context";
import { MapPin, Paintbrush, Palette, Square, Type, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  const [showTeacher, setShowTeacher] = useState(true);
  const [currentEntityId, setCurrentEntityId] = useState<string | null>(null);
  const [subjectTeachers, setSubjectTeachers] = useState<
    Record<string, string>
  >({});

  // Flags to track if inputs have been modified by user
  const [titleModified, setTitleModified] = useState(false);
  const [teacherNameModified, setTeacherNameModified] = useState(false);
  const [roomNumberModified, setRoomNumberModified] = useState(false);
  const [iconModified, setIconModified] = useState(false);

  // Refs to track previous values
  const prevSelectedCellRef = useRef<SelectedCell>(null);

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

  // Load cell-specific data when cell selection changes
  useEffect(() => {
    if (!selectedCell || !timetableData) return;

    // Only load data if not modified by user
    const entry = getScheduleEntry(
      timetableData,
      selectedCell.dayId,
      selectedCell.timeSlotId
    );

    if (entry) {
      if (!roomNumberModified) {
        setRoomNumber(entry.room || "");
      }

      // Find the entity to get its color and icon
      const entity =
        timetableData.subjects.find((s) => s.id === entry.entityId) ||
        timetableData.activities.find((a) => a.id === entry.entityId);

      if (entity) {
        setSelectedColor(entity.color);
        if (!iconModified) {
          setSelectedIcon(entity.icon);
        }
        setCurrentEntityId(entity.id);

        // Check if teacher should be displayed for this entry
        const showTeacherMatch = entry.notes.match(
          /ShowTeacher: (true|false)(?:\n|$)/
        );

        // Default to false when switching to a new cell
        const shouldShowTeacher = showTeacherMatch
          ? showTeacherMatch[1] === "true"
          : false;

        setShowTeacher(shouldShowTeacher);

        // Check if this subject has a teacher associated
        if (subjectTeachers[entity.id] && !teacherNameModified) {
          setTeacherName(subjectTeachers[entity.id]);
        } else if (!teacherNameModified) {
          // Extract teacher name from notes if it exists
          const teacherMatch = entry.notes.match(/Professeur: (.+?)(?:\n|$)/);
          if (teacherMatch && teacherMatch[1]) {
            setTeacherName(teacherMatch[1]);

            // Save this teacher for the subject
            const updatedTeachers = {
              ...subjectTeachers,
              [entity.id]: teacherMatch[1],
            };
            setSubjectTeachers(updatedTeachers);
            localStorage.setItem(
              "subjectTeachers",
              JSON.stringify(updatedTeachers)
            );
          } else {
            setTeacherName("");
          }
        }
      }
    }
  }, [
    selectedCell,
    timetableData,
    teacherNameModified,
    roomNumberModified,
    subjectTeachers,
    iconModified,
  ]);

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

    toast.success("Paramètres globaux enregistrés");

    // Reset modification flag
    setTitleModified(false);
  };

  // Save cell-specific settings
  const saveCellSettings = () => {
    if (!selectedCell || !timetableData || !currentEntityId) return;

    const entry = getScheduleEntry(
      timetableData,
      selectedCell.dayId,
      selectedCell.timeSlotId
    );

    if (entry) {
      // Update notes to include teacher name and display preference
      let notes = entry.notes;

      // Remove existing teacher info and display preference if present
      notes = notes.replace(/Professeur: .+?(?:\n|$)/, "");
      notes = notes.replace(/ShowTeacher: (true|false)(?:\n|$)/, "");

      // If teacher name is provided, save it for this subject
      if (teacherName) {
        const updatedTeachers = {
          ...subjectTeachers,
          [currentEntityId]: teacherName,
        };
        setSubjectTeachers(updatedTeachers);
        localStorage.setItem(
          "subjectTeachers",
          JSON.stringify(updatedTeachers)
        );

        // Add teacher to notes regardless of showTeacher setting
        notes = `Professeur: ${teacherName}\n${notes}`;
      }

      // Always add the ShowTeacher preference
      notes = `ShowTeacher: ${showTeacher}\n${notes}`;

      // Update the entry
      updateScheduleEntry(
        timetableData,
        selectedCell.dayId,
        selectedCell.timeSlotId,
        {
          room: roomNumber,
          notes: notes.trim(),
        }
      );

      // Update entity color and icon
      if (entry.entityId) {
        const entityType = entry.entityId.startsWith("s-")
          ? "subject"
          : "activity";

        // Update color and icon in the context
        updateEntityColor(entry.entityId, entityType, selectedColor);
        updateEntityIcon(entry.entityId, entityType, selectedIcon);

        // No need to manually update the data here as updateEntityColor and updateEntityIcon
        // already save the data to localStorage and update the context
      }

      toast.success("Modifications enregistrées");

      // Reset modification flags after save
      setTeacherNameModified(false);
      setRoomNumberModified(false);
      setIconModified(false);
    }
  };

  // Apply teacher to all instances of this subject
  const applyTeacherToAllInstances = () => {
    if (!timetableData || !currentEntityId || !teacherName) return;

    const updatedData = { ...timetableData };
    let changesMade = false;

    // Update all schedule entries with this entity ID
    updatedData.schedule = updatedData.schedule.map((entry) => {
      if (entry.entityId === currentEntityId) {
        let notes = entry.notes;

        // Remove existing teacher info if present
        notes = notes.replace(/Professeur: .+?(?:\n|$)/, "");

        // Add teacher info regardless of showTeacher setting
        notes = `Professeur: ${teacherName}\n${notes}`;
        changesMade = true;

        return {
          ...entry,
          notes: notes.trim(),
        };
      }
      return entry;
    });

    if (changesMade) {
      // Save the updated teacher for this subject
      const updatedTeachers = {
        ...subjectTeachers,
        [currentEntityId]: teacherName,
      };
      setSubjectTeachers(updatedTeachers);
      localStorage.setItem("subjectTeachers", JSON.stringify(updatedTeachers));

      // Save the updated timetable data
      saveTimeTableData(updatedData);
      toast.success(
        "Professeur appliqué à toutes les instances de cette matière"
      );
    } else {
      toast.info("Aucune modification n'a été nécessaire");
    }
  };

  // Handle teacher name change
  const handleTeacherNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeacherName(e.target.value);
    setTeacherNameModified(true);
  };

  // Handle room number change
  const handleRoomNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomNumber(e.target.value);
    setRoomNumberModified(true);
  };

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalSettings({
      ...globalSettings,
      title: e.target.value,
    });
    setTitleModified(true);
  };

  // Handle show teacher toggle
  const handleShowTeacherToggle = (checked: boolean) => {
    setShowTeacher(checked);
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

  return (
    <div className="space-y-6">
      {selectedCell ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Personnalisation du créneau</h3>
            <Button variant="ghost" size="sm" onClick={onCellDeselect}>
              Retour
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-2">
            {/* Appearance Section */}
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
                      onChangeComplete={saveCellSettings}
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
                            <span className="text-xl">{selectedIcon}</span>
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
                          }}
                          onClose={() => {}}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Section */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Professeur</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-name">Nom du professeur</Label>
                  <Input
                    id="teacher-name"
                    value={teacherName}
                    onChange={handleTeacherNameChange}
                    placeholder="Entrez le nom du professeur"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-teacher"
                    checked={showTeacher}
                    onCheckedChange={handleShowTeacherToggle}
                  />
                  <Label htmlFor="show-teacher">Afficher le professeur</Label>
                </div>

                {currentEntityId && teacherName && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={applyTeacherToAllInstances}
                  >
                    Appliquer à toutes les instances
                  </Button>
                )}
              </div>
            </div>

            {/* Room Section */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Salle</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-number">Numéro de salle</Label>
                <Input
                  id="room-number"
                  value={roomNumber}
                  onChange={handleRoomNumberChange}
                  placeholder="Entrez le numéro de salle"
                />
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={saveCellSettings}>
            Enregistrer les modifications
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Personnalisation globale</h3>

          <Tabs defaultValue="typography">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="typography">
                <Type className="h-4 w-4 mr-2" />
                Typographie
              </TabsTrigger>
              <TabsTrigger value="border">
                <Square className="h-4 w-4 mr-2" />
                Bordure
              </TabsTrigger>
              <TabsTrigger value="title">
                <Paintbrush className="h-4 w-4 mr-2" />
                Titre
              </TabsTrigger>
            </TabsList>

            <TabsContent value="typography" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="font-family">Police d&apos;écriture</Label>
                <Select
                  value={globalSettings.fontFamily}
                  onValueChange={(value) =>
                    setGlobalSettings({ ...globalSettings, fontFamily: value })
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

            <TabsContent value="border" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="border-color">Couleur de bordure</Label>
                <div className="flex items-center gap-2">
                  <ColorPicker
                    color={globalSettings.borderColor}
                    onChange={handleBorderColorChange}
                    onChangeComplete={saveGlobalSettings}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="border-width">Épaisseur de bordure</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="border-width"
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={globalSettings.borderWidth}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        borderWidth: parseInt(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="w-8 text-center">
                    {globalSettings.borderWidth}px
                  </span>
                </div>
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
          </Tabs>

          <Button className="w-full" onClick={saveGlobalSettings}>
            Enregistrer les paramètres
          </Button>
        </div>
      )}
    </div>
  );
}
