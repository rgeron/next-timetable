import { Timetable } from "@/components/dashboard/timetable";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tableau de bord | Emploi du Temps",
  description: "Gérez votre emploi du temps personnalisé",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="flex flex-col flex-1 px-4 md:px-6">
        <div className="flex items-center justify-between py-4 mb-2">
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
        </div>

        <Suspense
          fallback={
            <div className="h-[600px] flex items-center justify-center">
              Chargement...
            </div>
          }
        >
          <Timetable />
        </Suspense>
      </div>
    </div>
  );
}
