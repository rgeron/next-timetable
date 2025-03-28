import { parseTextToTimetableData, processFile } from "@/lib/vision-api";
import { NextRequest, NextResponse } from "next/server";

// Increase timeout and body size for PDF and image processing with OpenAI
export const config = {
  api: {
    bodyParser: false,
    responseLimit: "8mb",
    externalResolver: true,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    if (
      !file.type.includes("image/") &&
      !file.type.includes("application/pdf")
    ) {
      return NextResponse.json(
        { error: "Only image or PDF files are supported" },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      // Process the file using OpenAI's Vision API
      const extractedText = await processFile(buffer, file.type);

      // Parse the extracted text into timetable data
      const timetableData = parseTextToTimetableData(extractedText);

      // Check if we got any meaningful data
      const dataQuality = {
        hasMetadata: !!timetableData.metadata,
        hasDays:
          Array.isArray(timetableData.days) && timetableData.days.length > 0,
        hasTimeSlots:
          Array.isArray(timetableData.timeSlots) &&
          timetableData.timeSlots.length > 0,
        hasSchedule:
          Array.isArray(timetableData.schedule) &&
          timetableData.schedule.length > 0,
        hasSubjects:
          Array.isArray(timetableData.subjects) &&
          timetableData.subjects.length > 0,
      };

      return NextResponse.json({
        success: true,
        text: extractedText,
        timetableData,
        dataQuality,
      });
    } catch (processingError) {
      console.error("Error processing file content:", processingError);
      return NextResponse.json(
        {
          error: "Failed to process file content",
          details: (processingError as Error).message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json(
      { error: "Server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
