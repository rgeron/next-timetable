"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TimeTableData } from "@/lib/timetable";
import { Check, Upload } from "lucide-react";
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
      toast.error("Seuls les fichiers image ou PDF sont supportés");
      return;
    }

    // Check file size (limit to 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("La taille du fichier dépasse la limite de 10 Mo");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setExtractedPreview(null);

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
        throw new Error(
          result.details || result.error || "Échec du traitement du fichier"
        );
      }

      // Save the parsed timetable data
      if (result.timetableData) {
        const data = result.timetableData as Partial<TimeTableData>;

        // Create preview of extracted data
        if (data.metadata) {
          setExtractedPreview({
            school: data.metadata.school || "Inconnu",
            class: data.metadata.class || "Inconnu",
            year: data.metadata.year || "Inconnu",
            daysCount: data.days?.length || 0,
            timeSlotsCount: data.timeSlots?.length || 0,
          });

          toast.success("Données extraites avec succès");
        } else {
          toast.warning("Peu de données ont pu être extraites");
        }
      } else {
        toast.warning("Aucune donnée n'a pu être extraite");
      }
    } catch (error) {
      console.error("Erreur lors du traitement du fichier:", error);
      toast.error(`Erreur: ${(error as Error).message}`);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const handleConfirmImport = () => {
    toast.success("Données importées avec succès");
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  return (
    <div className="w-full">
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
            <p className="text-sm">
              {isUploading
                ? "Analyse en cours..."
                : "Déposez votre emploi du temps (image ou PDF)"}
            </p>
            <p className="text-xs text-muted-foreground">
              Notre IA extraira automatiquement les informations
            </p>
            {isUploading && (
              <div className="w-full space-y-2">
                <Progress value={uploadProgress} className="h-2" />
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
            <p className="text-sm font-medium">Données extraites avec succès</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="text-muted-foreground">École :</div>
            <div>{extractedPreview.school}</div>
            <div className="text-muted-foreground">Classe :</div>
            <div>{extractedPreview.class}</div>
            <div className="text-muted-foreground">Jours :</div>
            <div>{extractedPreview.daysCount}</div>
            <div className="text-muted-foreground">Créneaux :</div>
            <div>{extractedPreview.timeSlotsCount}</div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExtractedPreview(null)}
            >
              Annuler
            </Button>
            <Button size="sm" onClick={handleConfirmImport}>
              Importer
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
