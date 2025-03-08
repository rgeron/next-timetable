"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AVAILABLE_SUBJECTS } from "@/lib/file-it-data";
import { Subject } from "@/lib/timetable";
import { SearchInput } from "./search-input";
import { useSearch, useSelection, useTimeTableUpdater } from "./shared-utils";

export function ChooseSubject(props: {
  onSelect?: (subject: Subject) => void;
}) {
  const { searchQuery, setSearchQuery, filteredItems } =
    useSearch(AVAILABLE_SUBJECTS);
  const { selectedItem, handleSelect } =
    useSelection<(typeof AVAILABLE_SUBJECTS)[0]>();
  const { addSubjectToTimeTable } = useTimeTableUpdater();

  const handleAddSubject = () => {
    if (!selectedItem) return;

    const newSubject = addSubjectToTimeTable(selectedItem);

    if (props.onSelect) {
      props.onSelect(newSubject);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Choose a Subject</h2>

      <SearchInput
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search subjects..."
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map((subject) => (
          <SubjectCard
            key={subject.name}
            subject={subject}
            isSelected={selectedItem?.name === subject.name}
            onSelect={() => handleSelect(subject)}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleAddSubject} disabled={!selectedItem}>
          Add Subject
        </Button>
      </div>
    </div>
  );
}

function SubjectCard(props: {
  subject: (typeof AVAILABLE_SUBJECTS)[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { subject, isSelected, onSelect } = props;

  return (
    <Card
      className={`flex cursor-pointer flex-col items-center p-4 transition-all hover:bg-accent ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <div
        className="mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
        style={{ backgroundColor: subject.color }}
      >
        {subject.icon}
      </div>
      <div className="text-center">
        <div className="font-medium">{subject.name}</div>
        <div className="text-sm text-muted-foreground">{subject.shortName}</div>
      </div>
    </Card>
  );
}
