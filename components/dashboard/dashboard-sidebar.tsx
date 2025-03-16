"use client";

import { FileItPanel } from "@/components/file-it/file-it-panel";
import { ContinueButton } from "@/components/navigation/continue-button";
import { GoBackButton } from "@/components/navigation/go-back-button";
import { TimelineEditor } from "@/components/timeline/timeline-editor";
import {
  getNextStep,
  getPreviousStep,
  isFirstStep,
  isLastStep,
  Step,
} from "@/lib/step-navigation";
import { Clock } from "lucide-react";
import { ImportFile } from "./import-file";
import { PersonalizationPanel } from "./personalization-panel";
import { WelcomePanel } from "./welcome-panel";

// Type for the selected cell
type SelectedCell = {
  dayId: number;
  timeSlotId: number;
} | null;

export function DashboardSidebar(props: {
  currentStep: Step;
  onStepChange: (step: Step) => void;
  selectedCell: SelectedCell;
  onCellSelect: (cell: SelectedCell) => void;
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

  const handleCellDeselect = () => {
    props.onCellSelect(null);
  };

  return (
    <div className="w-1/3 flex-shrink-0 border-r border-primary/10 bg-gradient-to-b from-sidebar to-sidebar/95 flex flex-col h-full shadow-md">
      <div className="flex h-full flex-col">
        {/* Content based on current step - now scrollable */}
        <div className="flex-1 overflow-y-auto p-5 pr-3 custom-scrollbar">
          {renderSidebarContent(
            props.currentStep,
            props.selectedCell,
            handleCellDeselect
          )}
        </div>

        {/* Navigation buttons at the bottom - fixed position */}
        <div className="border-t border-primary/10 p-4 flex justify-between gap-2 bg-sidebar/90 backdrop-blur-sm">
          <div className="flex-1">
            {!isFirstStep(props.currentStep) && (
              <GoBackButton onClick={handleGoBack} />
            )}
          </div>
          <div className="flex-1 text-right">
            {!isLastStep(props.currentStep) && (
              <ContinueButton onClick={handleContinue} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderSidebarContent(
  step: Step,
  selectedCell: SelectedCell,
  onCellDeselect: () => void
) {
  // Render different content based on the current step
  switch (step) {
    case "bienvenue":
      return <WelcomePanel />;

    case "importer-fichier":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">
            Importer un fichier
          </h2>
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border border-primary/10">
            <p className="text-sm text-sidebar-foreground/80">
              Importez votre emploi du temps existant ou commencez de zéro.
            </p>
          </div>
          <ImportFile />
        </div>
      );

    case "horaires":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Horaires</h2>

          <div className="flex items-center text-sm font-medium mb-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
            <Clock className="w-4 h-4 mr-2 text-primary" />
            <span>Ajustement des créneaux</span>
          </div>

          <TimelineEditor compact={true} />
        </div>
      );

    case "organisation":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">
            Remplir les créneaux
          </h2>
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-3 rounded-lg border border-primary/10 mb-4">
            <p className="text-sm text-sidebar-foreground/80">
              Sélectionnez les matières et professeurs pour chaque créneau.
            </p>
          </div>
          <FileItPanel />
        </div>
      );

    case "personnaliser":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Personnaliser</h2>
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-3 rounded-lg border border-primary/10 mb-4">
            <p className="text-sm text-sidebar-foreground/80">
              Personnalisez l&apos;apparence et les détails de votre emploi du
              temps.
            </p>
          </div>
          <PersonalizationPanel
            selectedCell={selectedCell}
            onCellDeselect={onCellDeselect}
          />
        </div>
      );

    default:
      return <div>Sélectionnez une étape pour continuer</div>;
  }
}
