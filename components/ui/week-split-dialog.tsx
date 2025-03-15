"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

type WeekSplitDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onReplace: () => void;
  onSplit: (weekAEntityId: string, weekBEntityId: string) => void;
  existingEntityId: string;
  newEntityId: string;
};

export function WeekSplitDialog({
  isOpen,
  onClose,
  onReplace,
  onSplit,
  existingEntityId,
  newEntityId,
}: WeekSplitDialogProps) {
  const [weekAEntityId, setWeekAEntityId] = useState(existingEntityId);
  const [weekBEntityId, setWeekBEntityId] = useState(newEntityId);

  const handleSplit = () => {
    onSplit(weekAEntityId, weekBEntityId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créneau déjà occupé</DialogTitle>
          <DialogDescription>
            Ce créneau est déjà occupé par une matière. Que souhaitez-vous faire
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Semaine A</p>
            <Select
              value={weekAEntityId}
              onValueChange={(value) => setWeekAEntityId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir la matière pour la semaine A" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={existingEntityId}>
                  Matière existante
                </SelectItem>
                <SelectItem value={newEntityId}>Nouvelle matière</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Semaine B</p>
            <Select
              value={weekBEntityId}
              onValueChange={(value) => setWeekBEntityId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir la matière pour la semaine B" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={existingEntityId}>
                  Matière existante
                </SelectItem>
                <SelectItem value={newEntityId}>Nouvelle matière</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="sm:w-auto w-full"
          >
            Annuler
          </Button>
          <Button
            variant="outline"
            onClick={onReplace}
            className="sm:w-auto w-full"
          >
            Remplacer
          </Button>
          <Button onClick={handleSplit} className="sm:w-auto w-full">
            Séparer en semaines A/B
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
