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
  
  /* Week A/B badges */
  .week-badge {
    position: absolute !important;
    top: 2px !important;
    right: 2px !important;
    font-size: 7pt !important;
    font-weight: bold !important;
    padding: 1px 3px !important;
    border-radius: 2px !important;
    border: 1px solid #000 !important;
  }
  
  /* Week split divider */
  .week-split-divider {
    position: relative !important;
    margin-top: 8px !important;
    padding-top: 8px !important;
  }
  
  /* Ensure the divider line and label print correctly */
  .week-split-divider .border-t {
    border-top-style: dashed !important;
    border-top-width: 1.5px !important;
  }
  
  /* Make sure the "Semaine B" label is visible */
  .week-split-divider .absolute {
    background-color: white !important;
    padding: 0 2px !important;
    font-size: 7pt !important;
    font-weight: bold !important;
    border: 1px solid #000 !important;
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
    const title = settings?.title || "Emploi du Temps";
    const borderTheme = settings?.borderTheme || "none";

    // Clone the timetable container
    const timetableClone = timetableContainer.cloneNode(true);

    // Create a wrapper for the themed border
    const borderWrapper = document.createElement("div");
    borderWrapper.className = "themed-border-wrapper";

    // Write the HTML to the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            ${printStyles}
            
            /* Additional styles for the themed border */
            .themed-border-wrapper {
              position: relative;
              width: 100%;
              height: 100vh;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            
            /* Border theme styles */
            ${getBorderThemeStyles(borderTheme)}
            
            /* Title styles */
            .themed-title {
              position: absolute;
              z-index: 10;
              ${getTitleStyles(borderTheme)}
            }
            
            /* Background image styles */
            .themed-border-bg {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 0;
            }
            
            /* Content container */
            .themed-content {
              position: relative;
              z-index: 1;
              width: 75%;
              height: 75%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            /* Ensure the timetable fits within the border */
            .timetable-container {
              max-width: 100% !important;
              max-height: 100% !important;
              transform: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="themed-border-wrapper ${
              borderTheme !== "none" ? `border-theme-${borderTheme}` : ""
            }">
              ${
                borderTheme !== "none"
                  ? `
                <img src="/borders/${borderTheme}-border.png" class="themed-border-bg" />
                <div class="themed-title" style="${getTitlePosition(
                  borderTheme
                )}">${title}</div>
                <div class="themed-content">
                  ${timetableClone.outerHTML}
                </div>
              `
                  : timetableClone.outerHTML
              }
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Helper function to get border theme styles
  function getBorderThemeStyles(theme: string) {
    switch (theme) {
      case "superhero":
        return `
          .border-theme-superhero {
            border-radius: 8px;
            overflow: hidden;
            aspect-ratio: 1.414/1;
          }
        `;
      case "space":
        return `
          .border-theme-space {
            border-radius: 8px;
            overflow: hidden;
            aspect-ratio: 1.414/1;
          }
        `;
      case "nature":
        return `
          .border-theme-nature {
            border-radius: 8px;
            overflow: hidden;
            aspect-ratio: 1.414/1;
          }
        `;
      case "solid-color":
        return `
          .border-theme-solid-color {
            border-radius: 8px;
            background-color: rgba(59, 130, 246, 0.1);
            overflow: hidden;
            aspect-ratio: 1.414/1;
          }
        `;
      default:
        return "";
    }
  }

  // Helper function to get title position
  function getTitlePosition(theme: string) {
    switch (theme) {
      case "superhero":
        return "top: 5%; left: 50%; transform: translateX(-50%);";
      case "space":
        return "top: 5%; left: 50%; transform: translateX(-50%);";
      case "nature":
        return "top: 5%; left: 50%; transform: translateX(-50%);";
      case "solid-color":
        return "top: 5%; left: 50%; transform: translateX(-50%);";
      default:
        return "top: 5%; left: 50%; transform: translateX(-50%);";
    }
  }

  // Helper function to get title styles
  function getTitleStyles(theme: string) {
    switch (theme) {
      case "superhero":
        return `
          background-color: #dc2626;
          color: white;
          padding: 8px 24px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 24px;
        `;
      case "space":
        return `
          background-color: #4338ca;
          color: white;
          padding: 8px 24px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 24px;
        `;
      case "nature":
        return `
          background-color: #15803d;
          color: white;
          padding: 8px 24px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 24px;
        `;
      case "solid-color":
        return `
          background-color: #2563eb;
          color: white;
          padding: 8px 24px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 24px;
        `;
      default:
        return "";
    }
  }

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

  // For A4 preview, use a smaller base height to fit more content
  // Base height is pixels per 15 minutes
  const baseHeight = isA4Preview ? 10 : 20;

  // Minimum height to ensure content is visible
  const minHeight = isA4Preview ? 24 : 40;

  return Math.max(durationMinutes * (baseHeight / 15), minHeight);
}

// Function to calculate minutes from time string (e.g. "8h30" -> 510 minutes)
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split("h");
  return parseInt(hours) * 60 + (minutes ? parseInt(minutes) : 0);
}

// Hook to manage A4 preview state
export function useA4Preview() {
  const [isA4Preview, setIsA4Preview] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: "100%",
    height: "auto",
  });

  // Calculate dimensions based on viewport size
  useEffect(() => {
    const calculateDimensions = () => {
      // A4 paper dimensions (in pixels at 96 DPI)
      // For landscape, width is longer than height
      const maxWidth = Math.min(window.innerWidth * 0.85, 1123); // 85% of viewport width, max 1123px
      const heightBasedOnWidth = (maxWidth * a4Height) / a4Width; // Maintain A4 ratio

      setDimensions({
        width: `${maxWidth}px`,
        height: `${heightBasedOnWidth}px`,
      });
    };

    // Calculate on mount and window resize
    calculateDimensions();
    window.addEventListener("resize", calculateDimensions);

    return () => {
      window.removeEventListener("resize", calculateDimensions);
    };
  }, []);

  return {
    isA4Preview,
    setIsA4Preview,
    containerStyle: isA4Preview
      ? {
          width: dimensions.width,
          height: dimensions.height,
          maxWidth: "100%",
          transformOrigin: "top center",
          fontSize: "0.85rem",
          margin: "0 auto",
          overflow: "hidden",
          backgroundColor: "white",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
          borderRadius: "4px",
          padding: "0",
          position: "relative" as const,
          aspectRatio: `${a4Width} / ${a4Height}`,
        }
      : {},
  };
}
