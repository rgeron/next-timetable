"use client";

import { Step, STEPS } from "@/lib/step-navigation";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";

export function DashboardTopbar(props: {
  currentStep: Step;
  onStepChange: (step: Step) => void;
}) {
  return (
    <div className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
        {/* Logo */}
        <div className="mr-8 flex-shrink-0 font-semibold">Emploi du Temps</div>

        {/* Steps navigation */}
        <nav className="hidden flex-1 md:flex">
          <ol className="flex space-x-1">
            {STEPS.map((step, index) => {
              const isActive = step === props.currentStep;
              const isPast =
                STEPS.indexOf(step) < STEPS.indexOf(props.currentStep);

              return (
                <li key={step} className="flex items-center">
                  {/* Separator line */}
                  {index > 0 && (
                    <div
                      className={cn(
                        "h-px w-6 mx-2",
                        isPast || isActive ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}

                  {/* Step button */}
                  <button
                    onClick={() => props.onStepChange(step)}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      isActive && "bg-primary/10 text-primary",
                      !isActive && isPast && "text-primary hover:bg-primary/5",
                      !isActive &&
                        !isPast &&
                        "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {/* Status icon */}
                    {isPast ? (
                      <CheckCircle className="mr-2 size-4" />
                    ) : (
                      <Circle
                        className={cn(
                          "mr-2 size-4",
                          isActive && "fill-primary/10"
                        )}
                      />
                    )}

                    {/* Obtenir le nom français de chaque étape */}
                    {getStepDisplayName(step)}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Mobile view indicator (only shows current step) */}
        <div className="flex items-center md:hidden">
          <span className="text-sm font-medium">
            {getStepDisplayName(props.currentStep)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Fonction qui renvoie le nom d'affichage en français pour chaque étape
 */
function getStepDisplayName(step: Step): string {
  const displayNames: Record<Step, string> = {
    bienvenue: "Bienvenue",
    "importer-fichier": "Importer",
    horaires: "Horaires",
    organisation: "Organisation",
    personnaliser: "Personnaliser",
    imprimer: "Imprimer"
  };
  
  return displayNames[step] || step.charAt(0).toUpperCase() + step.slice(1).replace(/-/g, " ");
}
