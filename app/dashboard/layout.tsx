import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { TimetableProvider } from "@/lib/timetable-context";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Emploi du Temps",
    default: "Emploi du Temps",
  },
  description: "Plateforme de personnalisation d'emploi du temps",
};

export default function Layout() {
  return (
    <TimetableProvider>
      <DashboardClient />
    </TimetableProvider>
  );
}
