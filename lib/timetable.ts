// Types for timetable data
export type TimeTableMetadata = {
  school: string;
  year: string;
  class: string;
};

export type TimeSlot = {
  id: number;
  start: string;
  end: string;
};

export type Day = {
  id: number;
  name: string;
};

export type Subject = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  teachers: string[];
};

export type Activity = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
};

export type Split = {
  enabled: boolean;
  entityIdB?: string;
  roomB?: string;
  notes?: string;
};

export type ScheduleEntry = {
  id: number;
  dayId: number;
  timeSlotId: number;
  type: string;
  entityId: string;
  room: string;
  notes: string;
  weekType: string | null;
  split: Split;
};

export type TimeTableData = {
  metadata: TimeTableMetadata;
  timeSlots: TimeSlot[];
  days: Day[];
  subjects: Subject[];
  activities: Activity[];
  schedule: ScheduleEntry[];
  specialNotes: string[];
};

// Default timetable data
export const defaultTimeTableData: TimeTableData = {
  metadata: {
    school: "",
    year: "",
    class: "",
  },

  timeSlots: [
    { id: 1, start: "8h00", end: "9h00" },
    { id: 2, start: "9h00", end: "10h00" },
    { id: 3, start: "10h00", end: "11h00" },
    { id: 4, start: "11h00", end: "12h00" },
    { id: 5, start: "12h00", end: "13h00" },
    { id: 6, start: "13h00", end: "14h00" },
    { id: 7, start: "14h00", end: "15h00" },
    { id: 8, start: "15h00", end: "16h00" },
    { id: 9, start: "16h00", end: "17h00" },
    { id: 10, start: "17h00", end: "18h00" },
    { id: 11, start: "18h00", end: "19h00" },
    { id: 12, start: "19h00", end: "20h00" },
  ],

  days: [
    { id: 1, name: "lundi" },
    { id: 2, name: "mardi" },
    { id: 3, name: "mercredi" },
    { id: 4, name: "jeudi" },
    { id: 5, name: "vendredi" },
  ],

  subjects: [
    {
      id: "s-1",
      name: "Mathématiques",
      shortName: "Maths",
      color: "#3498db",
      icon: "📘",
      teachers: [],
    },
    {
      id: "s-2",
      name: "Français",
      shortName: "Fr",
      color: "#e74c3c",
      icon: "📕",
      teachers: [],
    },
    {
      id: "s-3",
      name: "Sciences de la Vie et de la Terre",
      shortName: "SVT",
      color: "#2ecc71",
      icon: "🌱",
      teachers: [],
    },
    {
      id: "s-4",
      name: "Histoire-Géographie",
      shortName: "HG",
      color: "#f1c40f",
      icon: "🌍",
      teachers: [],
    },
    {
      id: "s-5",
      name: "Physique-Chimie",
      shortName: "PC",
      color: "#9b59b6",
      icon: "⚗️",
      teachers: [],
    },
    {
      id: "s-6",
      name: "Éducation Musicale",
      shortName: "Musique",
      color: "#e67e22",
      icon: "🎵",
      teachers: [],
    },
    {
      id: "s-7",
      name: "Anglais LV1",
      shortName: "Anglais",
      color: "#1abc9c",
      icon: "🇬🇧",
      teachers: [],
    },
    {
      id: "s-8",
      name: "Technologie",
      shortName: "Techno",
      color: "#95a5a6",
      icon: "💻",
      teachers: [],
    },
    {
      id: "s-9",
      name: "Éducation Physique et Sportive",
      shortName: "EPS",
      color: "#34495e",
      icon: "⚽",
      teachers: [],
    },
  ],

  activities: [
    {
      id: "a-1",
      name: "Football",
      shortName: "Foot",
      color: "#27ae60",
      icon: "⚽",
    },
    {
      id: "a-2",
      name: "Danse",
      shortName: "Danse",
      color: "#e84393",
      icon: "💃",
    },
    {
      id: "a-3",
      name: "Gymnastique",
      shortName: "Gym",
      color: "#f39c12",
      icon: "🤸",
    },
    {
      id: "a-4",
      name: "Chant",
      shortName: "Chant",
      color: "#2980b9",
      icon: "🎤",
    },
  ],

  schedule: Array.from({ length: 60 }, (_, i) => ({
    id: i + 1,
    dayId: Math.floor(i / 12) + 1,
    timeSlotId: (i % 12) + 1,
    type: "",
    entityId: "",
    room: "",
    notes: "",
    weekType: null,
    split: { enabled: false },
  })),

  specialNotes: [],
};

// LocalStorage key
const TIMETABLE_STORAGE_KEY = "timetable-data";

// Function to get timetable data from localStorage
export function getTimeTableData(): TimeTableData {
  if (typeof window === "undefined") {
    return defaultTimeTableData;
  }

  try {
    const storedData = localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (!storedData) {
      return defaultTimeTableData;
    }

    return JSON.parse(storedData) as TimeTableData;
  } catch (error) {
    console.error("Error loading timetable data:", error);
    return defaultTimeTableData;
  }
}

// Function to save timetable data to localStorage
export function saveTimeTableData(data: TimeTableData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving timetable data:", error);
  }
}

// Helper function to get entity (subject or activity) by ID
export function getEntityById(data: TimeTableData, id: string) {
  if (id.startsWith("s-")) {
    return data.subjects.find((subject) => subject.id === id);
  } else if (id.startsWith("a-")) {
    return data.activities.find((activity) => activity.id === id);
  }
  return null;
}

// Helper to get a schedule entry for a specific day and time slot
export function getScheduleEntry(
  data: TimeTableData,
  dayId: number,
  timeSlotId: number
) {
  return data.schedule.find(
    (entry) => entry.dayId === dayId && entry.timeSlotId === timeSlotId
  );
}

// Function to update a schedule entry
export function updateScheduleEntry(
  data: TimeTableData, 
  dayId: number, 
  timeSlotId: number, 
  updates: Partial<ScheduleEntry>
): TimeTableData {
  const newData = structuredClone(data);
  const entryIndex = newData.schedule.findIndex(
    entry => entry.dayId === dayId && entry.timeSlotId === timeSlotId
  );
  
  if (entryIndex === -1) {
    return data;
  }
  
  newData.schedule[entryIndex] = {
    ...newData.schedule[entryIndex],
    ...updates
  };
  
  // Save changes to localStorage
  saveTimeTableData(newData);
  
  return newData;
}
