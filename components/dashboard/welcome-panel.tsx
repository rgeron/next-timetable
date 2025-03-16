"use client";

import { Button } from "@/components/ui/button";
import { defaultTimeTableData, saveTimeTableData } from "@/lib/timetable";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function WelcomePanel() {
  const handleStartFresh = () => {
    // Reset timetable data to default
    saveTimeTableData(defaultTimeTableData);

    // Reset global personalization features
    localStorage.removeItem("timetableGlobalSettings");

    // Reset subject teachers
    localStorage.removeItem("subjectTeachers");

    // Reset the DOM styles for immediate effect
    document.documentElement.style.setProperty(
      "--timetable-border-color",
      "#e2e8f0"
    );
    document.documentElement.style.setProperty(
      "--timetable-border-width",
      "1px"
    );

    toast.success("Emploi du temps réinitialisé aux paramètres par défaut");

    // Trigger a custom event to notify of timetable data change
    window.dispatchEvent(new Event("timetableDataChanged"));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary">Bienvenue</h2>

      <div className="flex flex-col items-center space-y-5">
        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg transform hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 z-10"></div>
          <img
            src="/images/papou.jpg"
            alt="Papou"
            className="object-cover w-full h-full"
          />
        </div>

        <div className="text-center max-w-xs mx-auto">
          <p className="text-sm text-sidebar-foreground/80 italic bg-primary/5 p-3 rounded-lg border border-primary/10">
            Ce site est créé en l&apos;honneur de Papou, dont la sagesse et la
            bienveillance continuent de nous inspirer.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border border-primary/10">
        <p className="text-sm text-sidebar-foreground/90">
          Commencez à personnaliser votre emploi du temps. Suivez les étapes
          pour créer votre planning idéal.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={handleStartFresh}
        className="w-full mt-4 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/20 hover:border-primary/30 transition-all duration-300"
      >
        <RefreshCw className="size-4 mr-2" />
        Recommencer à zéro
      </Button>
    </div>
  );
}
