"use client";

import { ContinueButton } from "@/components/navigation/continue-button";
import { GoBackButton } from "@/components/navigation/go-back-button";
import {
  getNextStep,
  getPreviousStep,
  isFirstStep,
  isLastStep,
  Step,
} from "@/lib/step-navigation";

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
    <div className="w-80 flex-shrink-0 border-r bg-sidebar p-4">
      <div className="flex h-full flex-col">
        {/* Navigation buttons at the top */}
        <div className="mb-6 space-y-2">
          {!isFirstStep(props.currentStep) && (
            <GoBackButton onClick={handleGoBack} />
          )}
          {!isLastStep(props.currentStep) && (
            <ContinueButton onClick={handleContinue} />
          )}
        </div>

        {/* Content based on current step */}
        <div className="flex-1">{renderSidebarContent(props.currentStep)}</div>
      </div>
    </div>
  );
}

function renderSidebarContent(step: Step) {
  // Render different content based on the current step
  switch (step) {
    case "welcome":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Welcome</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Get started with personalizing your timetable. Follow the steps to
            create your perfect schedule.
          </p>
        </div>
      );

    case "import-file":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Import File</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Upload your existing timetable or start from scratch.
          </p>
          {/* File import controls would go here */}
        </div>
      );

    case "timeline":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Configure the timeline settings for your timetable.
          </p>
          {/* Timeline configuration would go here */}
        </div>
      );

    case "file-it":
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">File It</h2>
          <p className="text-sm text-sidebar-foreground/80">
            Organize your courses and assignments.
          </p>
          {/* File organization controls would go here */}
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
