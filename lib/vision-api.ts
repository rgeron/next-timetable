import { OpenAI } from "openai";
import { Subject } from "./common-types";
import { ScheduleEntry, TimeTableData } from "./timetable";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This will be loaded from environment variables
});

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
              text: "This is a school timetable/schedule. Extract all text from this image, preserving the spatial layout. For each text element, include its approximate position as [x,y:text]. Pay special attention to:\n\n1. Time slots (e.g., 8h00-9h00)\n2. Days of the week (e.g., Lundi, Mardi)\n3. Subject names (e.g., Mathématiques, Français)\n4. Room numbers (e.g., Salle 101)\n5. Teacher names if present\n\nMaintain the relative positions of text elements to preserve the grid structure of the timetable.",
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

    // Process the extracted text to ensure it has position markers
    // If OpenAI didn't return position markers, try to add them
    if (!extractedText.includes("[") || !extractedText.includes(":]")) {
      console.warn(
        "OpenAI response doesn't contain position markers, adding basic positioning"
      );

      // Split by lines and add basic position markers
      const lines = extractedText.split("\n");
      let textWithPosition = "";

      lines.forEach((line, yIndex) => {
        const words = line.split(/\s+/);
        let xPosition = 10;

        words.forEach((word) => {
          if (word.trim()) {
            textWithPosition += `[${xPosition},${(yIndex + 1) * 20}:${word}] `;
            xPosition += word.length * 10 + 10; // Simple spacing based on word length
          }
        });

        textWithPosition += "\n";
      });

      return textWithPosition.trim();
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
  // Extract text with position markers if available
  const hasPositionMarkers =
    extractedText.includes("[") && extractedText.includes(":]");

  // Split text into lines
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

  // Extract schedule entries - this is the key addition
  let scheduleEntries: ScheduleEntry[] = [];

  if (hasPositionMarkers) {
    // Use position-based grid analysis for more accurate extraction
    scheduleEntries = extractScheduleEntriesFromPositionData(
      lines,
      days,
      timeSlots
    );
  } else {
    // Fallback to text-only analysis
    scheduleEntries = extractScheduleEntriesFromText(lines, days, timeSlots);
  }

  // Attempt to identify subjects from schedule content
  const extractedSubjects = extractSubjectsFromSchedule(lines, scheduleEntries);

  return {
    metadata,
    days: days.length > 0 ? days : undefined,
    timeSlots: timeSlots.length > 0 ? timeSlots : undefined,
    schedule: scheduleEntries.length > 0 ? scheduleEntries : undefined,
    subjects: extractedSubjects.length > 0 ? extractedSubjects : undefined,
  };
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
 * Extracts schedule entries from text with position markers
 */
function extractScheduleEntriesFromPositionData(
  lines: string[],
  days: { id: number; name: string }[],
  timeSlots: { id: number; start: string; end: string }[]
): ScheduleEntry[] {
  if (days.length === 0 || timeSlots.length === 0) {
    return [];
  }

  const scheduleEntries: ScheduleEntry[] = [];

  // Create a grid to map positions to days and time slots
  type PositionData = { x: number; y: number; text: string };
  const positionData: PositionData[] = [];

  // Extract positioned text elements
  const positionRegex = /\[(\d+),(\d+):([^\]]+)\]/g;
  lines.forEach((line) => {
    let match;
    while ((match = positionRegex.exec(line)) !== null) {
      const x = parseInt(match[1]);
      const y = parseInt(match[2]);
      const text = match[3].trim();
      if (text) {
        positionData.push({ x, y, text });
      }
    }
  });

  // Find the positions of day headers and time slots
  const dayPositions: { id: number; x: number; width: number }[] = [];
  const timeSlotPositions: { id: number; y: number; height: number }[] = [];

  // First, locate day headers by name match
  for (const day of days) {
    const dayElements = positionData.filter((item) =>
      item.text.toLowerCase().includes(day.name.toLowerCase())
    );

    if (dayElements.length > 0) {
      // Find average x position for this day
      const avgX =
        dayElements.reduce((sum, el) => sum + el.x, 0) / dayElements.length;
      dayPositions.push({ id: day.id, x: avgX, width: 100 }); // Width is an estimate
    }
  }

  // Sort day positions from left to right
  dayPositions.sort((a, b) => a.x - b.x);

  // Calculate column widths
  for (let i = 0; i < dayPositions.length - 1; i++) {
    dayPositions[i].width = dayPositions[i + 1].x - dayPositions[i].x - 10; // 10px buffer
  }

  // Second, locate time slots by looking for time patterns
  for (const slot of timeSlots) {
    const timePattern = `${slot.start.replace(":", "h")}-${slot.end.replace(
      ":",
      "h"
    )}`;
    const altTimePattern = `${slot.start}-${slot.end}`;

    const slotElements = positionData.filter(
      (item) =>
        item.text.includes(timePattern) || item.text.includes(altTimePattern)
    );

    if (slotElements.length > 0) {
      // Find average y position for this time slot
      const avgY =
        slotElements.reduce((sum, el) => sum + el.y, 0) / slotElements.length;
      timeSlotPositions.push({ id: slot.id, y: avgY, height: 50 }); // Height is an estimate
    }
  }

  // Sort time slot positions from top to bottom
  timeSlotPositions.sort((a, b) => a.y - b.y);

  // Calculate row heights
  for (let i = 0; i < timeSlotPositions.length - 1; i++) {
    timeSlotPositions[i].height =
      timeSlotPositions[i + 1].y - timeSlotPositions[i].y - 5; // 5px buffer
  }

  // Now scan through all elements and assign them to the right day/timeslot
  for (const item of positionData) {
    // Skip if the text is a day name or time slot
    if (
      days.some((day) =>
        item.text.toLowerCase().includes(day.name.toLowerCase())
      ) ||
      timeSlots.some(
        (slot) => item.text.includes(slot.start) || item.text.includes(slot.end)
      )
    ) {
      continue;
    }

    // Find which day column this item belongs to
    let dayId: number | null = null;
    for (let i = 0; i < dayPositions.length; i++) {
      const day = dayPositions[i];
      const nextDay = dayPositions[i + 1];

      if (nextDay) {
        if (item.x >= day.x && item.x < nextDay.x) {
          dayId = day.id;
          break;
        }
      } else if (item.x >= day.x) {
        dayId = day.id;
        break;
      }
    }

    // Find which time slot row this item belongs to
    let timeSlotId: number | null = null;
    for (let i = 0; i < timeSlotPositions.length; i++) {
      const slot = timeSlotPositions[i];
      const nextSlot = timeSlotPositions[i + 1];

      if (nextSlot) {
        if (item.y >= slot.y && item.y < nextSlot.y) {
          timeSlotId = slot.id;
          break;
        }
      } else if (item.y >= slot.y) {
        timeSlotId = slot.id;
        break;
      }
    }

    // If we found both day and time slot, create a schedule entry
    if (dayId && timeSlotId) {
      // Check if we already have an entry for this day/timeslot
      let entry = scheduleEntries.find(
        (e) => e.dayId === dayId && e.timeSlotId === timeSlotId
      );

      if (!entry) {
        // Create a new entry
        entry = {
          id: scheduleEntries.length + 1,
          dayId,
          timeSlotId,
          type: "subject", // Default to subject
          entityId: "", // Will be set based on subject name
          room: "",
          notes: "",
          weekType: null,
          split: { enabled: false },
        };
        scheduleEntries.push(entry);
      }

      // Add the text to the appropriate field
      if (item.text.match(/salle|room/i)) {
        entry.room = item.text.replace(/salle|room/i, "").trim();
      } else if (entry.entityId === "") {
        // Assume first non-room text is the subject name
        entry.entityId = item.text;
      } else {
        // Additional info goes into notes
        if (entry.notes) {
          entry.notes += " " + item.text;
        } else {
          entry.notes = item.text;
        }
      }
    }
  }

  return scheduleEntries;
}

/**
 * Fallback method to extract schedule entries from text without position data
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
