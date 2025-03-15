"use client";

import { Step, STEPS } from "@/lib/step-navigation";
import { useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { Timetable } from "./timetable";

// Type for the selected cell
type SelectedCell = {
  dayId: number;
  timeSlotId: number;
} | null;

export function DashboardLayout() {
  // State to keep track of the current step
  const [currentStep, setCurrentStep] = useState<Step>(STEPS[0]);
  // State to keep track of the selected cell for personalization
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);

  return (
    <div className="flex h-screen flex-col">
      {/* Topbar */}
      <DashboardTopbar
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          selectedCell={selectedCell}
          onCellSelect={setSelectedCell}
        />

        {/* Main content - Toujours afficher l'emploi du temps */}
        <main className="flex-1 overflow-auto p-4 flex justify-center">
          <div className="w-full max-w-[1200px]">
            <Timetable
              onCellSelect={setSelectedCell}
              selectedCell={selectedCell}
              currentStep={currentStep}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
