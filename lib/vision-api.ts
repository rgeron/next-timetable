import { OpenAI } from "openai";
import { Subject } from "./common-types";
import { ScheduleEntry, TimeTableData } from "./timetable";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This will be loaded from environment variables
});

// Add these interfaces at the top of the file, after the imports
interface OpenAITimetableData {
  school?: string;
  year?: string;
  class?: string;
  days?: string[];
  timeSlots?: Array<string | { start: string; end: string }>;
  subjects?: Array<string | { name: string }>;
  schedule?: Array<{
    day: string;
    timeSlot: string;
    subject: string;
    room?: string;
    notes?: string;
  }>;
}

interface SubjectObject {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  teachers: string[];
}

/**
 * Processes a file based on its type and extracts text
 */
export async function processFile(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  if (fileType.includes("application/pdf")) {
    // Try PDF extraction methods in order of preference
    try {
      return await extractTextFromPdfWithPDFJSExtract(buffer);
    } catch (error) {
      console.warn("PDFExtract failed, falling back to OpenAI API:", error);
      // Fallback to OpenAI API for PDF text extraction
      return await extractTextFromImage(buffer);
    }
  } else if (fileType.includes("image/")) {
    return await extractTextFromImage(buffer);
  } else {
    throw new Error("Unsupported file type");
  }
}

/**
 * Extracts text from a PDF using pdf.js-extract with positional information
 */
async function extractTextFromPdfWithPDFJSExtract(
  pdfBuffer: Buffer
): Promise<string> {
  try {
    // Import the PDF extraction library
    const { PDFExtract } = await import("pdf.js-extract");
    const pdfExtract = new PDFExtract();

    // Setup options
    const options = {};

    // Convert buffer to Uint8Array which pdf.js-extract expects
    const data = await pdfExtract.extractBuffer(pdfBuffer, options);

    // Instead of just concatenating text, preserve the positional data by adding
    // a positional marker to each item in a form that can be parsed later
    const textWithPosition = data.pages
      .map((page) => {
        // Sort content by Y position (top to bottom) then X position (left to right)
        const sortedContent = [...page.content].sort((a, b) => {
          // Create row groups with small tolerance for y-position differences
          const yDiff = Math.abs(a.y - b.y);
          if (yDiff < 5) {
            return a.x - b.x; // Same row, sort by x position
          }
          return a.y - b.y; // Different rows, sort by y position
        });

        // Track the current row to detect row changes
        let currentRowY = sortedContent.length > 0 ? sortedContent[0].y : 0;
        let result = "";

        // Process the content items
        for (const item of sortedContent) {
          // If we've moved to a new row (with some tolerance for alignment)
          if (Math.abs(item.y - currentRowY) > 5) {
            result += "\n"; // Add a newline for a new row
            currentRowY = item.y;
          }

          // Add position markers around text: [x,y:text]
          result += `[${Math.round(item.x)},${Math.round(item.y)}:${
            item.str
          }] `;
        }

        return result;
      })
      .join("\n\n");

    return textWithPosition;
  } catch (error) {
    console.error("Error extracting text from PDF with PDFExtract:", error);
    throw error;
  }
}

/**
 * Extracts text from an image using OpenAI's Vision API
 * Also used as a fallback for PDF files
 */
async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    // Convert buffer to base64
    const base64Image = buffer.toString("base64");

    // Call OpenAI API with the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "This is a school timetable/schedule. Analyze this image and extract the following information in a structured format:\n\n1. Days of the week present in the timetable\n2. Time slots (start and end times)\n3. For each day and time slot, identify the subject taught\n4. Any additional information like room numbers or teacher names\n\nReturn the data in a structured format that can be easily parsed. Include the raw text of the timetable at the end.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${
                  buffer.length > 1024 * 1024 ? "application/pdf" : "image/png"
                };base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
    });

    // Extract the text from the response
    const extractedText = response.choices[0]?.message?.content || "";

    // If no text was extracted, throw an error
    if (!extractedText) {
      throw new Error("No text detected in the image");
    }

    return extractedText;
  } catch (error) {
    console.error("Error extracting text from image/buffer:", error);
    throw new Error(`Text extraction failed: ${(error as Error).message}`);
  }
}

/**
 * Parses extracted text into timetable data structure
 */
export function parseTextToTimetableData(
  extractedText: string
): Partial<TimeTableData> {
  try {
    // First, try to parse as JSON if the response looks like JSON
    if (
      extractedText.trim().startsWith("{") &&
      extractedText.trim().endsWith("}")
    ) {
      try {
        // Extract JSON if it's embedded in text
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          return processStructuredData(jsonData);
        }
      } catch (e) {
        console.warn(
          "Failed to parse as JSON, falling back to text parsing",
          e
        );
      }
    }

    // Split text into lines for traditional parsing
    const lines = extractedText
      .split("\n")
      .filter((line) => line.trim().length > 0);

    // Basic metadata
    const metadata = {
      school: extractSchoolName(lines),
      year: extractYear(lines),
      class: extractClass(lines),
    };

    // Extract days and time slots
    const days = extractDays(lines);
    const timeSlots = extractTimeSlots(lines);

    // Extract schedule entries from text
    const scheduleEntries = extractScheduleEntriesFromText(
      lines,
      days,
      timeSlots
    );

    // Attempt to identify subjects from schedule content
    const extractedSubjects = extractSubjectsFromSchedule(
      lines,
      scheduleEntries
    );

    return {
      metadata,
      days: days.length > 0 ? days : undefined,
      timeSlots: timeSlots.length > 0 ? timeSlots : undefined,
      schedule: scheduleEntries.length > 0 ? scheduleEntries : undefined,
      subjects: extractedSubjects.length > 0 ? extractedSubjects : undefined,
    };
  } catch (error) {
    console.error("Error parsing timetable data:", error);
    return {
      metadata: {
        school: "Unknown School",
        year: new Date().getFullYear().toString(),
        class: "Unknown Class",
      },
    };
  }
}

/**
 * Process structured data from OpenAI into timetable format
 */
function processStructuredData(
  data: OpenAITimetableData
): Partial<TimeTableData> {
  const result: Partial<TimeTableData> = {
    metadata: {
      school: data.school || "Unknown School",
      year: data.year || new Date().getFullYear().toString(),
      class: data.class || "Unknown Class",
    },
    days: [],
    timeSlots: [],
    subjects: [],
    schedule: [],
  };

  // Process days
  if (data.days && Array.isArray(data.days)) {
    result.days = data.days.map((day: string, index: number) => ({
      id: index + 1,
      name: day,
    }));
  }

  // Process time slots
  if (data.timeSlots && Array.isArray(data.timeSlots)) {
    result.timeSlots = data.timeSlots.map((slot, index: number) => {
      // Handle different possible formats
      let start = typeof slot === "string" ? slot : slot.start || "";
      let end = typeof slot === "string" ? "" : slot.end || "";

      if (typeof slot === "string") {
        // Handle format like "8h00-9h00"
        const parts = slot.split(/[-–—]/);
        if (parts.length === 2) {
          start = parts[0].trim();
          end = parts[1].trim();
        }
      }

      // Normalize time format
      start = normalizeTimeFormat(start);
      end = normalizeTimeFormat(end);

      return {
        id: index + 1,
        start,
        end: end || incrementTimeByOneHour(start),
      };
    });
  }

  // Process subjects
  const subjectMap = new Map<string, SubjectObject>();
  if (data.subjects && Array.isArray(data.subjects)) {
    data.subjects.forEach((subject, index: number) => {
      const name = typeof subject === "string" ? subject : subject.name;
      if (name && !subjectMap.has(name)) {
        const shortName = generateShortName(name);
        const color = getColorForIndex(index);

        const subjectObj: SubjectObject = {
          id: `s-${index + 1}`,
          name,
          shortName,
          color,
          icon: "📘",
          teachers: [],
        };

        subjectMap.set(name, subjectObj);
        result.subjects?.push(subjectObj);
      }
    });
  }

  // Process schedule
  if (data.schedule && Array.isArray(data.schedule)) {
    data.schedule.forEach((entry, index: number) => {
      const dayName = entry.day;
      const timeSlot = entry.timeSlot;
      const subject = entry.subject;

      if (dayName && timeSlot && subject) {
        const dayId =
          result.days?.findIndex(
            (d) => d.name.toLowerCase() === dayName.toLowerCase()
          ) ?? -1;
        let timeSlotId = -1;

        // Find matching time slot
        result.timeSlots?.forEach((slot, idx) => {
          if (timeSlot.includes(slot.start) || timeSlot.includes(slot.end)) {
            timeSlotId = idx;
          }
        });

        if (dayId >= 0 && timeSlotId >= 0) {
          // Find or create subject
          let subjectId = "";
          let existingSubject = Array.from(subjectMap.values()).find(
            (s) => s.name.toLowerCase() === subject.toLowerCase()
          );

          if (!existingSubject && subject) {
            const newSubjectIndex = (result.subjects?.length || 0) + 1;
            existingSubject = {
              id: `s-${newSubjectIndex}`,
              name: subject,
              shortName: generateShortName(subject),
              color: getColorForIndex(newSubjectIndex - 1),
              icon: "📘",
              teachers: [],
            };
            subjectMap.set(subject, existingSubject);
            result.subjects?.push(existingSubject);
          }

          if (existingSubject) {
            subjectId = existingSubject.id;
          }

          result.schedule?.push({
            id: index + 1,
            dayId: dayId + 1,
            timeSlotId: timeSlotId + 1,
            type: "subject",
            entityId: subjectId,
            room: entry.room || "",
            notes: entry.notes || "",
            weekType: null,
            split: { enabled: false },
          });
        }
      }
    });
  }

  return result;
}

// Helper function to generate a short name for a subject
function generateShortName(name: string): string {
  if (name.length <= 10) return name;

  // Generate abbreviation from first letters of words
  const words = name.split(/\s+/);
  if (words.length > 1) {
    return words.map((word) => word[0]).join("");
  }

  // Just take first few letters
  return name.slice(0, 6);
}

// Helper function to get a color based on index
function getColorForIndex(index: number): string {
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
    "#16a085",
    "#d35400",
    "#8e44ad",
    "#27ae60",
    "#2980b9",
    "#f39c12",
  ];
  return colors[index % colors.length];
}

// Helper function to increment time by one hour
function incrementTimeByOneHour(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const newHours = (hours + 1) % 24;
  return `${newHours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

// Helper functions for parsing - customize based on timetable format
function extractSchoolName(lines: string[]): string {
  // Look for school name in header lines
  for (const line of lines.slice(0, 5)) {
    if (
      line.includes("École") ||
      line.includes("Collège") ||
      line.includes("Lycée")
    ) {
      return line.trim();
    }
  }
  return "Unknown School";
}

function extractYear(lines: string[]): string {
  // Look for year information
  const yearRegex = /20\d{2}-20\d{2}|20\d{2}/;
  for (const line of lines.slice(0, 10)) {
    const match = line.match(yearRegex);
    if (match) {
      return match[0];
    }
  }
  return new Date().getFullYear().toString();
}

function extractClass(lines: string[]): string {
  // Look for class identifier
  const classRegex = /Classe\s*:\s*([^,\n]+)/i;
  for (const line of lines.slice(0, 10)) {
    const match = line.match(classRegex);
    if (match) {
      return match[1].trim();
    }
  }
  return "Unknown Class";
}

function extractDays(lines: string[]): { id: number; name: string }[] {
  // This is a placeholder implementation - customize based on your timetable format
  const daysOfWeek = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];
  const days: { id: number; name: string }[] = [];

  // Look for day names in the header rows
  for (const line of lines.slice(0, 20)) {
    for (let i = 0; i < daysOfWeek.length; i++) {
      // Case insensitive match
      const dayLower = daysOfWeek[i].toLowerCase();
      if (line.toLowerCase().includes(dayLower)) {
        // Avoid duplicates
        if (!days.some((d) => d.name.toLowerCase() === dayLower)) {
          days.push({ id: i + 1, name: daysOfWeek[i] });
        }
      }
    }
  }

  return days;
}

function extractTimeSlots(
  lines: string[]
): { id: number; start: string; end: string }[] {
  // This is a placeholder implementation - customize based on your timetable format
  const timeSlots: { id: number; start: string; end: string }[] = [];
  // Match various time formats: 8h-9h, 8h00-9h00, 8:00-9:00, etc.
  const timeRegex = /(\d{1,2}[hH:]?\d{0,2})\s*[-–—]\s*(\d{1,2}[hH:]?\d{0,2})/;

  let id = 1;
  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      // Process start time
      let start = match[1].trim();
      start = start.replace(/[hH]/, ":").replace(/:$/, ":00");
      if (!start.includes(":")) start += ":00";

      // Process end time
      let end = match[2].trim();
      end = end.replace(/[hH]/, ":").replace(/:$/, ":00");
      if (!end.includes(":")) end += ":00";

      // Normalize time format
      const normalizedStart = normalizeTimeFormat(start);
      const normalizedEnd = normalizeTimeFormat(end);

      // Avoid duplicates
      if (
        !timeSlots.some(
          (slot) => slot.start === normalizedStart && slot.end === normalizedEnd
        )
      ) {
        timeSlots.push({
          id: id++,
          start: normalizedStart,
          end: normalizedEnd,
        });
      }
    }
  }

  // Sort time slots chronologically
  timeSlots.sort((a, b) => {
    return a.start.localeCompare(b.start);
  });

  // Reassign IDs based on chronological order
  timeSlots.forEach((slot, index) => {
    slot.id = index + 1;
  });

  return timeSlots;
}

// Helper function to normalize time formats
function normalizeTimeFormat(time: string): string {
  // Handle cases like "8:30", "8:", "8", etc.
  if (time.includes(":")) {
    const [hours, minutes] = time.split(":");
    return `${hours.padStart(2, "0")}:${(minutes || "00").padStart(2, "0")}`;
  } else {
    return `${time.padStart(2, "0")}:00`;
  }
}

/**
 * Extract schedule entries from text
 */
function extractScheduleEntriesFromText(
  lines: string[],
  days: { id: number; name: string }[],
  timeSlots: { id: number; start: string; end: string }[]
): ScheduleEntry[] {
  if (days.length === 0 || timeSlots.length === 0) {
    return [];
  }

  const scheduleEntries: ScheduleEntry[] = [];

  // Simple keyword-based approach
  const subjectKeywords = [
    "Mathématiques",
    "Maths",
    "Français",
    "Fr",
    "Sciences",
    "SVT",
    "Histoire",
    "Géographie",
    "Physique",
    "Chimie",
    "Éducation",
    "Musique",
    "Anglais",
    "Technologie",
    "EPS",
    "Sport",
  ];

  // Room pattern recognition
  const roomRegex = /salle\s+([A-Za-z0-9]+)|([A-Za-z]\d{2,3})/i;

  // For each line, check if it contains a subject
  lines.forEach((line) => {
    const lowerLine = line.toLowerCase();

    // Skip lines that are day names or time slots
    if (
      days.some((day) => lowerLine.includes(day.name.toLowerCase())) ||
      timeSlots.some(
        (slot) => line.includes(slot.start) || line.includes(slot.end)
      )
    ) {
      return;
    }

    // Check if the line mentions a subject
    const containsSubject = subjectKeywords.some((keyword) =>
      lowerLine.includes(keyword.toLowerCase())
    );

    if (containsSubject) {
      // Try to determine which day and time slot this belongs to
      let possibleDayId = null;
      for (const day of days) {
        // Look for day name in nearby lines
        if (
          lines
            .slice(Math.max(0, lines.indexOf(line) - 5), lines.indexOf(line))
            .some((l) => l.toLowerCase().includes(day.name.toLowerCase()))
        ) {
          possibleDayId = day.id;
          break;
        }
      }

      let possibleTimeSlotId = null;
      for (const slot of timeSlots) {
        // Look for time in nearby lines
        if (
          lines
            .slice(
              Math.max(0, lines.indexOf(line) - 3),
              lines.indexOf(line) + 1
            )
            .some((l) => l.includes(slot.start) || l.includes(slot.end))
        ) {
          possibleTimeSlotId = slot.id;
          break;
        }
      }

      if (possibleDayId && possibleTimeSlotId) {
        // Extract room information if available
        const roomMatch = line.match(roomRegex);
        const room = roomMatch ? roomMatch[1] || roomMatch[2] : "";

        // Create a schedule entry
        scheduleEntries.push({
          id: scheduleEntries.length + 1,
          dayId: possibleDayId,
          timeSlotId: possibleTimeSlotId,
          type: "subject",
          entityId: "", // Will be mapped later
          room,
          notes: line, // Store the full line for now
          weekType: null,
          split: { enabled: false },
        });
      }
    }
  });

  return scheduleEntries;
}

/**
 * Extracts subject data from the schedule
 */
function extractSubjectsFromSchedule(
  lines: string[],
  scheduleEntries: ScheduleEntry[]
): Subject[] {
  const subjects: Subject[] = [];
  const subjectNames = new Set<string>();

  // Extract unique subjects from schedule entries
  scheduleEntries.forEach((entry) => {
    if (entry.entityId && !subjectNames.has(entry.entityId)) {
      subjectNames.add(entry.entityId);

      // Simplified name extraction
      let shortName = entry.entityId;
      if (shortName.length > 10) {
        // Generate abbreviation from first letters of words
        const words = shortName.split(" ");
        if (words.length > 1) {
          shortName = words.map((word) => word[0]).join("");
        } else {
          shortName = shortName.slice(0, 6); // Just take first few letters
        }
      }

      // Generate a simple color based on name
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
      const colorIndex = subjects.length % colors.length;

      subjects.push({
        id: `s-${subjects.length + 1}`,
        name: entry.entityId,
        shortName,
        color: colors[colorIndex],
        icon: "📘", // Default icon
        teachers: [],
      });
    }
  });

  // Now update the entityId in schedule entries to match subject IDs
  scheduleEntries.forEach((entry) => {
    const subject = subjects.find((s) => s.name === entry.entityId);
    if (subject) {
      entry.entityId = subject.id;
    }
  });

  return subjects;
}
