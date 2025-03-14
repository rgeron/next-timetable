"use client";

import { FileItPanel } from "@/components/file-it/file-it-panel";
import { ContinueButton } from "@/components/navigation/continue-button";
import { GoBackButton } from "@/components/navigation/go-back-button";
import { TimelineEditor } from "@/components/timeline/timeline-editor";
import { Button } from "@/components/ui/button";
import {
  getNextStep,
  getPreviousStep,
  isFirstStep,
  isLastStep,
  Step,
} from "@/lib/step-navigation";
import { defaultTimeTableData, saveTimeTableData } from "@/lib/timetable";
import { Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ImportFile } from "./import-file";

export function DashboardSidebar(props: {
  currentStep: Step;
  onStepChange: (step: Step) => void;
}) {
  const handleContinue = () => {
    const nextStep = getNextStep(props.currentStep);
    if (nextStep) {
      props.onStepChange(nextStep);
    }
  };

  const handleGoBack = () => {
    const prevStep = getPreviousStep(props.currentStep);
    if (prevStep) {
      props.onStepChange(prevStep);
    }
  };

  return (
    <div className="w-1/3 flex-shrink-0 border-r bg-sidebar flex flex-col h-full">
      <div className="flex h-full flex-col">
        {/* Content based on current step - now scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pr-2 custom-scrollbar">
          {renderSidebarContent(props.currentStep)}
        </div>

        {/* Navigation buttons at the bottom - fixed position */}
        <div className="border-t p-4 flex justify-between gap-2 bg-sidebar">
          <div className="flex-1">
            {!isFirstStep(props.currentStep) && (
              <GoBackButton onClick={handleGoBack} />
            )}
          </div>
          <div className="flex-1">
            {!isLastStep(props.currentStep) && (
              <ContinueButton onClick={handleContinue} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderSidebarContent(step: Step) {
  // Render different content based on the current step
  switch (step) {
    case "bienvenue":
      const handleStartFresh = () => {
        saveTimeTableData(defaultTimeTableData);
        toast.success("Emploi du temps réinitialisé aux paramètres par défaut");
        // Trigger a custom event to notify of timetable data change
        window.dispatchEvent(new Event("timetableDataChanged"));
      };

      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Bienvenue</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Commencez à personnaliser votre emploi du temps. Suivez les étapes
            pour créer votre planning idéal.
          </p>

          <Button
            variant="outline"
            onClick={handleStartFresh}
            className="w-full mt-4"
          >
            <RefreshCw className="size-4 mr-2" />
            Recommencer à zéro
          </Button>
        </div>
      );

    case "importer-fichier":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Importer un fichier</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Importez votre emploi du temps existant ou commencez de zéro.
          </p>
          <ImportFile />
        </div>
      );

    case "horaires":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Horaires</h2>
          <p className="text-sm text-sidebar-foreground/80 mb-4">
            Ajustez les horaires de début et de fin pour chaque créneau de votre
            emploi du temps.
          </p>

          <div className="flex items-center text-sm font-medium mb-2">
            <Clock className="w-4 h-4 mr-2" />
            <span>Ajustement des créneaux</span>
          </div>

          <TimelineEditor compact={true} />
        </div>
      );

    case "organisation":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Remplir les créneaux</h2>
          <FileItPanel />
        </div>
      );

    case "personnaliser":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Personnaliser</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Personnalisez l&apos;apparence et les paramètres de votre emploi du
            temps.
          </p>
          {/* Personalization controls would go here */}
        </div>
      );

    case "imprimer":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Imprimer</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Exportez ou imprimez votre emploi du temps finalisé.
          </p>
          {/* Print/Export controls would go here */}
        </div>
      );

    default:
      return <div>Sélectionnez une étape pour continuer</div>;
  }
}
