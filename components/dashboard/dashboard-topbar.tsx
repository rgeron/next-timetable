"use client";

import { Step, STEPS } from "@/lib/step-navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";

export function DashboardTopbar(props: {
  currentStep: Step;
  onStepChange: (step: Step) => void;
}) {
  return (
    <div className="sticky top-0 z-10 border-b bg-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex-shrink-0 font-semibold text-lg tracking-tight">
          Emploi du Temps
        </div>

        {/* Steps navigation */}
        <nav className="hidden flex-1 justify-center md:flex">
          <ol className="flex space-x-1">
            {STEPS.map((step, index) => {
              const isActive = step === props.currentStep;
              const isPast =
                STEPS.indexOf(step) < STEPS.indexOf(props.currentStep);

              return (
                <li key={step} className="flex items-center">
                  {/* Separator line */}
                  {index > 0 && (
                    <motion.div
                      className={cn(
                        "h-px w-6 mx-2",
                        isPast || isActive ? "bg-primary" : "bg-border"
                      )}
                      animate={{
                        backgroundColor:
                          isPast || isActive
                            ? "var(--primary)"
                            : "var(--border)",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  )}

                  {/* Step button */}
                  <motion.button
                    onClick={() => props.onStepChange(step)}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      isActive && "bg-primary/10 text-primary",
                      !isActive && isPast && "text-primary hover:bg-primary/5",
                      !isActive &&
                        !isPast &&
                        "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Status icon */}
                    <motion.div
                      animate={{
                        rotate: isPast ? 360 : 0,
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.5 }}
                    >
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
                    </motion.div>

                    {/* Step name */}
                    <motion.span
                      animate={{
                        fontWeight: isActive ? 600 : 400,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {getStepDisplayName(step)}
                    </motion.span>
                  </motion.button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Mobile view indicator (only shows current step) */}
        <div className="flex items-center md:hidden">
          <motion.span
            className="text-sm font-medium"
            key={props.currentStep}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {getStepDisplayName(props.currentStep)}
          </motion.span>
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
    organisation: "Remplir",
    personnaliser: "Personnaliser",
  };

  return (
    displayNames[step] ||
    step.charAt(0).toUpperCase() + step.slice(1).replace(/-/g, " ")
  );
}
