"use client";

import { Button } from "@/components/ui/button";
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

// Common emoji icons for subjects
const commonIcons = [
  "📚",
  "📝",
  "🧮",
  "🔬",
  "🧪",
  "🎨",
  "🎭",
  "🏀",
  "⚽",
  "🎵",
  "🌍",
  "💻",
  "📊",
  "📈",
  "🔤",
  "🧠",
  "📖",
  "🎬",
  "🏛️",
  "🧬",
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

  // Flags to track if inputs have been modified by user
  const [titleModified, setTitleModified] = useState(false);
  const [teacherNameModified, setTeacherNameModified] = useState(false);
  const [roomNumberModified, setRoomNumberModified] = useState(false);

  // Refs to track previous values
  const prevSelectedCellRef = useRef<SelectedCell>(null);

  // Load saved global settings on mount only
  useEffect(() => {
    const savedSettings = localStorage.getItem("timetableGlobalSettings");
    if (savedSettings && !titleModified) {
      setGlobalSettings(JSON.parse(savedSettings));
    }
  }, [titleModified]);

  // Reset modification flags when cell selection changes
  useEffect(() => {
    if (selectedCell !== prevSelectedCellRef.current) {
      setTeacherNameModified(false);
      setRoomNumberModified(false);
      prevSelectedCellRef.current = selectedCell;
    }
  }, [selectedCell]);

  // Load cell-specific data when cell selection changes
  useEffect(() => {
    if (!selectedCell || !timetableData) return;

    // Only load data if not modified by user
    if (!teacherNameModified && !roomNumberModified) {
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
          setSelectedIcon(entity.icon);
        }

        // Extract teacher name from notes if it exists
        if (!teacherNameModified) {
          const teacherMatch = entry.notes.match(/Professeur: (.+?)(?:\n|$)/);
          if (teacherMatch && teacherMatch[1]) {
            setTeacherName(teacherMatch[1]);
          } else {
            setTeacherName("");
          }
        }
      }
    }
  }, [selectedCell, timetableData, teacherNameModified, roomNumberModified]);

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
    if (!selectedCell || !timetableData) return;

    const entry = getScheduleEntry(
      timetableData,
      selectedCell.dayId,
      selectedCell.timeSlotId
    );

    if (entry) {
      // Update notes to include teacher name
      let notes = entry.notes;
      if (teacherName) {
        // Remove existing teacher info if present
        notes = notes.replace(/Professeur: .+?(?:\n|$)/, "");
        // Add new teacher info
        notes = `Professeur: ${teacherName}\n${notes}`;
      } else {
        // Remove teacher info if empty
        notes = notes.replace(/Professeur: .+?(?:\n|$)/, "");
      }

      // Update the entry
      const updatedData = updateScheduleEntry(
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
        updateEntityColor(entry.entityId, entityType, selectedColor);
        updateEntityIcon(entry.entityId, entityType, selectedIcon);
      }

      saveTimeTableData(updatedData);
      toast.success("Modifications enregistrées");

      // Reset modification flags after save
      setTeacherNameModified(false);
      setRoomNumberModified(false);
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

          <Tabs defaultValue="appearance">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">
                <Palette className="h-4 w-4 mr-2" />
                Apparence
              </TabsTrigger>
              <TabsTrigger value="teacher">
                <User className="h-4 w-4 mr-2" />
                Professeur
              </TabsTrigger>
              <TabsTrigger value="room">
                <MapPin className="h-4 w-4 mr-2" />
                Salle
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="cell-color">Couleur</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cell-color"
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icône</Label>
                <div className="grid grid-cols-10 gap-2">
                  {commonIcons.map((icon) => (
                    <Button
                      key={icon}
                      variant={selectedIcon === icon ? "default" : "outline"}
                      className="h-10 w-10 p-0"
                      onClick={() => setSelectedIcon(icon)}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teacher" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-name">Nom du professeur</Label>
                <Input
                  id="teacher-name"
                  value={teacherName}
                  onChange={handleTeacherNameChange}
                  placeholder="Entrez le nom du professeur"
                />
              </div>
            </TabsContent>

            <TabsContent value="room" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="room-number">Numéro de salle</Label>
                <Input
                  id="room-number"
                  value={roomNumber}
                  onChange={handleRoomNumberChange}
                  placeholder="Entrez le numéro de salle"
                />
              </div>
            </TabsContent>
          </Tabs>

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
                  <Input
                    id="border-color"
                    type="color"
                    value={globalSettings.borderColor}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        borderColor: e.target.value,
                      })
                    }
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    type="text"
                    value={globalSettings.borderColor}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        borderColor: e.target.value,
                      })
                    }
                    className="flex-1"
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
