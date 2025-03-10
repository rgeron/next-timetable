"use client";

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
import { FileItSidebar } from "../file-it/file-it-panel";
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
    case "welcome":
      const handleStartFresh = () => {
        saveTimeTableData(defaultTimeTableData);
        toast.success("Timetable reset to default settings");
        // Trigger a custom event to notify of timetable data change
        window.dispatchEvent(new Event("timetableDataChanged"));
      };

      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Welcome</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Get started with personalizing your timetable. Follow the steps to
            create your perfect schedule.
          </p>

          <Button
            variant="outline"
            onClick={handleStartFresh}
            className="w-full mt-4"
          >
            <RefreshCw className="size-4 mr-2" />
            Start Fresh
          </Button>
        </div>
      );

    case "import-file":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Import File</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Upload your existing timetable or start from scratch.
          </p>
          <ImportFile />
        </div>
      );

    case "timeline":
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

    case "file-it":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">File It</h2>
          <FileItSidebar />
        </div>
      );

    case "personalize":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Personalize</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Customize the appearance and settings of your timetable.
          </p>
          {/* Personalization controls would go here */}
        </div>
      );

    case "print":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Print</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Export or print your finalized timetable.
          </p>
          {/* Print/Export controls would go here */}
        </div>
      );

    default:
      return <div>Select a step to continue</div>;
  }
}
