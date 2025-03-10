import { Activity, ColorOption, IconOption, Subject } from "./common-types";

export const AVAILABLE_COLORS: ColorOption[] = [
  { id: "red", value: "#ef4444", name: "Red" },
  { id: "orange", value: "#f97316", name: "Orange" },
  { id: "amber", value: "#f59e0b", name: "Amber" },
  { id: "yellow", value: "#eab308", name: "Yellow" },
  { id: "lime", value: "#84cc16", name: "Lime" },
  { id: "green", value: "#22c55e", name: "Green" },
  { id: "emerald", value: "#10b981", name: "Emerald" },
  { id: "teal", value: "#14b8a6", name: "Teal" },
  { id: "cyan", value: "#06b6d4", name: "Cyan" },
  { id: "sky", value: "#0ea5e9", name: "Sky" },
  { id: "blue", value: "#3b82f6", name: "Blue" },
  { id: "indigo", value: "#6366f1", name: "Indigo" },
  { id: "violet", value: "#8b5cf6", name: "Violet" },
  { id: "purple", value: "#a855f7", name: "Purple" },
  { id: "fuchsia", value: "#d946ef", name: "Fuchsia" },
  { id: "pink", value: "#ec4899", name: "Pink" },
  { id: "rose", value: "#f43f5e", name: "Rose" },
];

export const AVAILABLE_ICONS: IconOption[] = [
  { id: "book", value: "📚", category: "education" },
  { id: "pencil", value: "✏️", category: "education" },
  { id: "ruler", value: "📏", category: "education" },
  { id: "calculator", value: "🧮", category: "education" },
  { id: "globe", value: "🌍", category: "geography" },
  { id: "atom", value: "⚛️", category: "science" },
  { id: "microscope", value: "🔬", category: "science" },
  { id: "test-tube", value: "🧪", category: "science" },
  { id: "dna", value: "🧬", category: "science" },
  { id: "math", value: "➗", category: "math" },
  { id: "literature", value: "📖", category: "literature" },
  { id: "history", value: "🏛️", category: "history" },
  { id: "art", value: "🎨", category: "art" },
  { id: "music", value: "🎵", category: "music" },
  { id: "sports", value: "🏃", category: "sports" },
  { id: "soccer", value: "⚽", category: "sports" },
  { id: "basketball", value: "🏀", category: "sports" },
  { id: "volleyball", value: "🏐", category: "sports" },
  { id: "tennis", value: "🎾", category: "sports" },
  { id: "swimming", value: "🏊", category: "sports" },
  { id: "cycling", value: "🚴", category: "sports" },
  { id: "running", value: "🏃‍♂️", category: "sports" },
  { id: "gym", value: "🏋️", category: "sports" },
  { id: "yoga", value: "🧘", category: "sports" },
  { id: "dance", value: "💃", category: "arts" },
  { id: "cooking", value: "👨‍🍳", category: "hobby" },
  { id: "gardening", value: "🌱", category: "hobby" },
  { id: "gaming", value: "🎮", category: "hobby" },
  { id: "coding", value: "💻", category: "tech" },
  { id: "language", value: "🗣️", category: "language" },
  { id: "english", value: "🇬🇧", category: "language" },
  { id: "french", value: "🇫🇷", category: "language" },
  { id: "spanish", value: "🇪🇸", category: "language" },
  { id: "german", value: "🇩🇪", category: "language" },
  { id: "italian", value: "🇮🇹", category: "language" },
  { id: "chinese", value: "🇨🇳", category: "language" },
  { id: "japanese", value: "🇯🇵", category: "language" },
  { id: "arabic", value: "🇸🇦", category: "language" },
  { id: "russian", value: "🇷🇺", category: "language" },
  { id: "portuguese", value: "🇵🇹", category: "language" },
];

export const AVAILABLE_SUBJECTS: Omit<Subject, "id" | "teachers">[] = [
  { name: "Mathematics", shortName: "Math", color: "#3b82f6", icon: "➗" },
  { name: "Physics", shortName: "Phy", color: "#8b5cf6", icon: "⚛️" },
  { name: "Chemistry", shortName: "Chem", color: "#10b981", icon: "🧪" },
  { name: "Biology", shortName: "Bio", color: "#22c55e", icon: "🧬" },
  { name: "Computer Science", shortName: "CS", color: "#06b6d4", icon: "💻" },
  { name: "English", shortName: "Eng", color: "#ef4444", icon: "🇬🇧" },
  { name: "French", shortName: "Fr", color: "#d946ef", icon: "🇫🇷" },
  { name: "Spanish", shortName: "Esp", color: "#f97316", icon: "🇪🇸" },
  { name: "German", shortName: "Ger", color: "#eab308", icon: "🇩🇪" },
  { name: "History", shortName: "Hist", color: "#f59e0b", icon: "🏛️" },
  { name: "Geography", shortName: "Geo", color: "#84cc16", icon: "🌍" },
  { name: "Art", shortName: "Art", color: "#ec4899", icon: "🎨" },
  { name: "Music", shortName: "Mus", color: "#0ea5e9", icon: "🎵" },
  { name: "Physical Education", shortName: "PE", color: "#14b8a6", icon: "🏃" },
  { name: "Economics", shortName: "Econ", color: "#6366f1", icon: "📊" },
  { name: "Business Studies", shortName: "Bus", color: "#a855f7", icon: "💼" },
  { name: "Psychology", shortName: "Psych", color: "#f43f5e", icon: "🧠" },
  { name: "Sociology", shortName: "Soc", color: "#3b82f6", icon: "👥" },
  { name: "Philosophy", shortName: "Phil", color: "#ef4444", icon: "🤔" },
  { name: "Religious Studies", shortName: "RS", color: "#84cc16", icon: "🕌" },
];

export const AVAILABLE_ACTIVITIES: Omit<Activity, "id">[] = [
  { name: "Soccer", shortName: "Soccer", color: "#22c55e", icon: "⚽" },
  { name: "Basketball", shortName: "BBall", color: "#f97316", icon: "🏀" },
  { name: "Volleyball", shortName: "VBall", color: "#3b82f6", icon: "🏐" },
  { name: "Tennis", shortName: "Tennis", color: "#84cc16", icon: "🎾" },
  { name: "Swimming", shortName: "Swim", color: "#0ea5e9", icon: "🏊" },
  { name: "Running", shortName: "Run", color: "#ef4444", icon: "🏃‍♂️" },
  { name: "Gym", shortName: "Gym", color: "#6366f1", icon: "🏋️" },
  { name: "Yoga", shortName: "Yoga", color: "#d946ef", icon: "🧘" },
  { name: "Dance", shortName: "Dance", color: "#ec4899", icon: "💃" },
  { name: "Art Club", shortName: "Art", color: "#f43f5e", icon: "🎨" },
  { name: "Music Band", shortName: "Band", color: "#0ea5e9", icon: "🎵" },
  { name: "Drama Club", shortName: "Drama", color: "#a855f7", icon: "🎭" },
  { name: "Chess Club", shortName: "Chess", color: "#f59e0b", icon: "♟️" },
  { name: "Coding Club", shortName: "Code", color: "#06b6d4", icon: "💻" },
  { name: "Science Club", shortName: "Science", color: "#10b981", icon: "🔬" },
  { name: "Debate Club", shortName: "Debate", color: "#ef4444", icon: "🎤" },
  { name: "Book Club", shortName: "Books", color: "#8b5cf6", icon: "📚" },
  {
    name: "Photography Club",
    shortName: "Photo",
    color: "#14b8a6",
    icon: "📷",
  },
  { name: "Cooking Club", shortName: "Cook", color: "#f97316", icon: "👨‍🍳" },
  { name: "Gardening Club", shortName: "Garden", color: "#84cc16", icon: "🌱" },
];

export function generateUniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

// Functions to create new Subject or Activity with generated IDs
export function createNewSubject(
  data: Omit<Subject, "id" | "teachers">
): Subject {
  return {
    ...data,
    id: generateUniqueId("s"),
    teachers: [],
  };
}

export function createNewActivity(data: Omit<Activity, "id">): Activity {
  return {
    ...data,
    id: generateUniqueId("a"),
  };
}
