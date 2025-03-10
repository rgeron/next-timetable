import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";
import { TimeTableData } from "./timetable";

// Initialize the client with credentials
const client = new ImageAnnotatorClient({
  keyFilename: path.join(
    process.cwd(),
    "credentials/next-timetable-3ab9613301bd.json"
  ),
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
      console.warn("PDFExtract failed, falling back to Vision API:", error);
      // Fallback to Vision API for PDF text extraction
      return await extractTextFromImage(buffer);
    }
  } else if (fileType.includes("image/")) {
    return await extractTextFromImage(buffer);
  } else {
    throw new Error("Unsupported file type");
  }
}

/**
 * Extracts text from a PDF using pdf.js-extract
 */
async function extractTextFromPdfWithPDFJSExtract(
  pdfBuffer: Buffer
): Promise<string> {
  try {
    // Import the PDF extraction library
    const { PDFExtract } = await import("pdf.js-extract");
    const pdfExtract = new PDFExtract();

    // Setup options
    const options = {
      // No special options needed
    };

    // Convert buffer to Uint8Array which pdf.js-extract expects
    const data = await pdfExtract.extractBuffer(pdfBuffer, options);

    // Concatenate text from all pages
    const text = data.pages
      .map((page) => {
        return page.content.map((item) => item.str).join(" ");
      })
      .join("\n\n");

    return text;
  } catch (error) {
    console.error("Error extracting text from PDF with PDFExtract:", error);
    throw error;
  }
}

/**
 * Extracts text from an image using Google Cloud Vision API
 * Also used as a fallback for PDF files
 */
async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const [result] = await client.textDetection(buffer);
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      throw new Error("No text detected in the image");
    }

    // The first annotation contains the entire extracted text
    return detections[0].description || "";
  } catch (error) {
    console.error("Error extracting text from image/buffer:", error);
    throw new Error(`Text extraction failed: ${(error as Error).message}`);
  }
}

/**
 * Parses extracted text into timetable data structure
 * This is a placeholder implementation - you'll need to customize
 * based on your specific timetable format
 */
export function parseTextToTimetableData(
  extractedText: string
): Partial<TimeTableData> {
  // Basic implementation - this should be customized based on your specific timetable format
  const lines = extractedText
    .split("\n")
    .filter((line) => line.trim().length > 0);

  // Example parsing logic - will need to be tailored to match your timetable format
  const metadata = {
    school: extractSchoolName(lines),
    year: extractYear(lines),
    class: extractClass(lines),
  };

  // Extract days and time slots
  const days = extractDays(lines);
  const timeSlots = extractTimeSlots(lines);

  return {
    metadata,
    days: days.length > 0 ? days : undefined,
    timeSlots: timeSlots.length > 0 ? timeSlots : undefined,
    // Other fields would be added here based on extracted data
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
      if (line.includes(daysOfWeek[i])) {
        // Avoid duplicates
        if (!days.some((d) => d.name === daysOfWeek[i])) {
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
  const timeRegex = /(\d{1,2}[hH]\d{0,2})\s*-\s*(\d{1,2}[hH]\d{0,2})/;

  let id = 1;
  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const start = match[1].replace("h", ":").replace("H", ":");
      const end = match[2].replace("h", ":").replace("H", ":");

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
