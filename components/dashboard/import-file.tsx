"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeTableData } from "@/lib/timetable";
import {
  AlertCircle,
  Check,
  FileText,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type ExtractedPreview = {
  school: string;
  class: string;
  year: string;
  daysCount: number;
  timeSlotsCount: number;
};

export function ImportFile() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedPreview, setExtractedPreview] =
    useState<ExtractedPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFile = async (file: File) => {
    // Validate file type
    if (
      !file.type.includes("image/") &&
      !file.type.includes("application/pdf")
    ) {
      toast.error("Only image or PDF files are supported");
      return;
    }

    // Check file size (limit to 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds the 10MB limit");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setExtractedPreview(null);

    // For PDFs, show a special message
    if (file.type.includes("application/pdf")) {
      toast.info("Processing PDF file. This may take a moment...");
    }

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress =
          prev + (file.type.includes("application/pdf") ? 3 : 5);
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 100);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.details || result.error || "Failed to process file";

        // Check if it's a PDF-specific error
        if (
          file.type.includes("application/pdf") &&
          errorMessage.includes("PDF")
        ) {
          throw new Error(
            "PDF processing failed. Please try a different PDF or convert it to an image."
          );
        }

        throw new Error(errorMessage);
      }

      // Save the parsed timetable data
      if (result.timetableData) {
        const data = result.timetableData as Partial<TimeTableData>;

        // Create preview of extracted data
        if (data.metadata) {
          setExtractedPreview({
            school: data.metadata.school || "Unknown",
            class: data.metadata.class || "Unknown",
            year: data.metadata.year || "Unknown",
            daysCount: data.days?.length || 0,
            timeSlotsCount: data.timeSlots?.length || 0,
          });

          if (data.days?.length === 0 && data.timeSlots?.length === 0) {
            toast.warning(
              "Limited data could be extracted. You may need to manually enter some information."
            );
          } else {
            toast.success("Timetable data extracted successfully!");
          }
        } else {
          toast.warning(
            "Limited data could be extracted. The timetable structure wasn't recognized."
          );
        }
      } else {
        toast.warning("No timetable data could be extracted");
      }
    } catch (error) {
      console.error("Error processing file:", error);

      // Provide more helpful messages for common errors
      const errorMessage = (error as Error).message;

      if (errorMessage.includes("PDF")) {
        toast.error("PDF processing failed", {
          description:
            "Try converting your PDF to an image (JPEG/PNG) and uploading that instead.",
        });
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("connection")
      ) {
        toast.error("Network error", {
          description: "Check your internet connection and try again.",
        });
      } else {
        toast.error(`Error: ${errorMessage}`, {
          description: "Please try another file or check your connection.",
        });
      }
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const handleConfirmImport = () => {
    // This would need to be implemented to save the extracted data
    toast.success("Timetable data imported successfully!");

    // Trigger event to refresh the timetable view
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  const handleContinue = () => {
    // This would need to be implemented to handle manual entry
    toast.success("Manual entry not implemented yet");
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="pt-4">
          {!extractedPreview && (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragging ? "border-primary bg-primary/10" : "border-border"}
                ${isUploading ? "pointer-events-none opacity-70" : ""}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileSelector}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isUploading
                      ? "Processing file..."
                      : "Drop your file here or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload an image or PDF of your timetable
                  </p>
                </div>
                {isUploading && (
                  <div className="w-full space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {uploadProgress < 100
                        ? "Analyzing timetable..."
                        : "Finalizing..."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {extractedPreview && (
            <Card className="p-4 border rounded-lg">
              <div className="flex items-start mb-3">
                <div className="rounded-full bg-green-100 p-1 mr-3">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">
                    Extracted Data Preview
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Review the extracted information before importing
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">School:</div>
                  <div className="font-medium">{extractedPreview.school}</div>

                  <div className="text-muted-foreground">Class:</div>
                  <div className="font-medium">{extractedPreview.class}</div>

                  <div className="text-muted-foreground">Academic Year:</div>
                  <div className="font-medium">{extractedPreview.year}</div>

                  <div className="text-muted-foreground">Days Found:</div>
                  <div className="font-medium">
                    {extractedPreview.daysCount}
                  </div>

                  <div className="text-muted-foreground">Time Slots:</div>
                  <div className="font-medium">
                    {extractedPreview.timeSlotsCount}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExtractedPreview(null)}
                >
                  Try Another File
                </Button>
                <Button size="sm" onClick={handleConfirmImport}>
                  Import Timetable
                </Button>
              </div>
            </Card>
          )}

          {!extractedPreview && (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Supported formats:
                </p>
                <div className="flex gap-3">
                  <Card className="flex items-center gap-2 p-2 text-xs">
                    <ImageIcon className="h-4 w-4" />
                    <span>Images (JPEG, PNG)</span>
                  </Card>
                  <Card className="flex items-center gap-2 p-2 text-xs">
                    <FileText className="h-4 w-4" />
                    <span>PDF</span>
                  </Card>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
                <div className="flex items-start">
                  <AlertCircle className="mr-2 h-4 w-4 mt-0.5" />
                  <div>
                    <p>
                      The quality of data extraction depends on the clarity of
                      the image. For best results, ensure the timetable is
                      clearly visible with good lighting.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="manual" className="pt-4">
          <div className="text-center p-6 space-y-4">
            <h3 className="text-sm font-medium">Manual Entry</h3>
            <p className="text-xs text-muted-foreground">
              Use this option if automatic extraction isn&apos;t working.
              Continue to the next steps to manually create your timetable.
            </p>
            <Button onClick={handleContinue} className="mt-4">
              Continue to Manual Setup
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
