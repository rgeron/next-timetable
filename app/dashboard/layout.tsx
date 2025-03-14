import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { TimetableProvider } from "@/lib/timetable-context";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Emploi du Temps",
    default: "Emploi du Temps",
  },
  description: "Plateforme de personnalisation d'emploi du temps",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TimetableProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </TimetableProvider>
  );
}
