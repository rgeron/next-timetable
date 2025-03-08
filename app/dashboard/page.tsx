import { Metadata } from "next";
import { Suspense } from "react";
import { Timetable } from "@/components/dashboard/timetable";

export const metadata: Metadata = {
  title: "Tableau de bord | Emploi du Temps",
  description: "Gérez votre emploi du temps personnalisé",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="flex flex-col flex-1 py-4 px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
        
        <Suspense fallback={<div className="h-[600px] flex items-center justify-center">Chargement...</div>}>
          <Timetable />
        </Suspense>
      </div>
    </div>
  );
} 