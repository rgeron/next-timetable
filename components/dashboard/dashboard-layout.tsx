"use client";

import { Step, STEPS } from "@/lib/step-navigation";
import { useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

export function DashboardLayout(props: { children?: React.ReactNode }) {
  // State to keep track of the current step
  const [currentStep, setCurrentStep] = useState<Step>(STEPS[0]);

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
        />

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {props.children || (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select options in the sidebar to configure your timetable
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
