"use client";

import { Toggle } from "@/components/ui/toggle";
import { type TimeTableData } from "@/lib/timetable";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";

// Print-specific styles for landscape A4
const printStyles = `
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }
  
  body {
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Hide everything except the timetable */
  body > div > *:not(.print-container) {
    display: none !important;
  }
  
  /* Hide all UI elements */
  .no-print {
    display: none !important;
  }
  
  .print-only {
    display: block !important;
  }
  
  /* Make the timetable container take the full page */
  .print-container {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
  }
  
  .timetable-container {
    width: 100% !important;
    height: auto !important;
    transform: none !important;
    font-size: 10pt !important;
    box-shadow: none !important;
    border: 1px solid #ddd !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .timetable-grid {
    width: 100% !important;
  }
  
  .timetable-cell {
    page-break-inside: avoid;
  }
  
  .timetable-header {
    background-color: #f5f5f5 !important;
    font-weight: bold !important;
    font-size: 11pt !important;
  }
  
  .timetable-time {
    background-color: #f9f9f9 !important;
    font-size: 10pt !important;
  }
  
  /* Ensure colors print correctly */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
}
`;

// A4 paper dimensions (in pixels at 96 DPI)
// A4 is 210mm × 297mm, which is roughly 794px × 1123px at 96 DPI
// For landscape, we swap width and height
export const a4Width = 1123; // Landscape width (was height in portrait)
export const a4Height = 794; // Landscape height (was width in portrait)

export function PrintControls({
  timetableData,
  isA4Preview,
  setIsA4Preview,
}: {
  timetableData: TimeTableData;
  isA4Preview: boolean;
  setIsA4Preview: (value: boolean) => void;
}) {
  // Add print styles to the document
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement("style");
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Function to print only the timetable
  const handlePrint = () => {
    // Create a new window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Veuillez autoriser les popups pour imprimer l'emploi du temps.");
      return;
    }

    // Get the timetable HTML
    const timetableContainer = document.querySelector(".timetable-container");
    if (!timetableContainer || !timetableData) return;

    // Get global settings for styling
    const globalSettings = localStorage.getItem("timetableGlobalSettings");
    const settings = globalSettings ? JSON.parse(globalSettings) : null;

    // Create HTML content for the print window
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Emploi du Temps</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 10mm;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .timetable-container {
              width: 100% !important;
              height: auto !important;
              border: 1px solid #ddd;
              box-shadow: none !important;
              transform: none !important;
            }
            .timetable-grid {
              display: grid;
              width: 100%;
            }
            .timetable-header {
              background-color: #f5f5f5 !important;
              font-weight: bold;
              padding: 8px;
              text-align: center;
              border-bottom: 1px solid #ddd;
            }
            .timetable-time {
              background-color: #f9f9f9 !important;
              padding: 8px;
              text-align: center;
              border-bottom: 1px solid #ddd;
              border-right: 1px solid #ddd;
            }
            .timetable-cell {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          </style>
        </head>
        <body onload="setTimeout(function() { window.print(); }, 500)">
          <div style="text-align: center; margin-bottom: 15px;">
            <h1 style="margin-bottom: 5px; font-size: 24px;">${
              settings?.title || "Emploi du Temps"
            }</h1>
            <div style="font-size: 14px; color: #666;">
              ${
                timetableData.metadata.school
                  ? timetableData.metadata.school + " • "
                  : ""
              }
              ${
                timetableData.metadata.year
                  ? timetableData.metadata.year + " • "
                  : ""
              }
              ${timetableData.metadata.class || ""}
            </div>
          </div>
          ${timetableContainer.outerHTML}
          <script>
            window.addEventListener('afterprint', function() {
              window.close();
            });
          </script>
        </body>
      </html>
    `;

    // Write to the new window
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex justify-end mb-4 items-center gap-2 no-print">
      <Toggle
        pressed={isA4Preview}
        onPressedChange={setIsA4Preview}
        aria-label="Toggle A4 preview"
        className="data-[state=on]:bg-primary"
      >
        <Printer className="h-4 w-4 mr-2" />
        Format A4 Paysage
      </Toggle>

      <button
        onClick={handlePrint}
        className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Printer className="h-4 w-4" />
        Imprimer
      </button>
    </div>
  );
}

// Helper function to calculate slot height based on duration
export function calculateSlotHeight(
  start: string,
  end: string,
  isA4Preview: boolean = false
): number {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  // Calculate duration in minutes
  const durationMinutes = endMinutes - startMinutes;

  // Base height is 20px per 15 minutes (adjust as needed)
  // For A4 preview, reduce the height by 30%
  const baseHeight = isA4Preview ? 14 : 20;
  return Math.max(durationMinutes * (baseHeight / 15), isA4Preview ? 28 : 40); // Minimum height adjusted for A4
}

// Function to calculate minutes from time string (e.g. "8h30" -> 510 minutes)
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split("h");
  return parseInt(hours) * 60 + (minutes ? parseInt(minutes) : 0);
}

// Hook to manage A4 preview state
export function useA4Preview() {
  const [isA4Preview, setIsA4Preview] = useState(false);

  return {
    isA4Preview,
    setIsA4Preview,
    containerStyle: isA4Preview
      ? {
          width: `${a4Width * 0.8}px`, // 80% of A4 landscape width
          height: `${a4Height * 0.8}px`, // 80% of A4 landscape height
          maxWidth: "100%",
          transform: "scale(0.9)",
          transformOrigin: "top center",
          fontSize: "0.85rem",
        }
      : {},
  };
}
