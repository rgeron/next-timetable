"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AVAILABLE_ACTIVITIES } from "@/lib/file-it-data";
import { Activity } from "@/lib/timetable";
import { SearchInput } from "./search-input";
import { useSearch, useSelection, useTimeTableUpdater } from "./shared-utils";

export function ChooseActivity(props: {
  onSelect?: (activity: Activity) => void;
}) {
  const { searchQuery, setSearchQuery, filteredItems } =
    useSearch(AVAILABLE_ACTIVITIES);
  const { selectedItem, handleSelect } =
    useSelection<(typeof AVAILABLE_ACTIVITIES)[0]>();
  const { addActivityToTimeTable } = useTimeTableUpdater();

  const handleAddActivity = () => {
    if (!selectedItem) return;

    const newActivity = addActivityToTimeTable(selectedItem);

    if (props.onSelect) {
      props.onSelect(newActivity);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Choose an Activity</h2>

      <SearchInput
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search activities..."
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map((activity) => (
          <ActivityCard
            key={activity.name}
            activity={activity}
            isSelected={selectedItem?.name === activity.name}
            onSelect={() => handleSelect(activity)}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleAddActivity} disabled={!selectedItem}>
          Add Activity
        </Button>
      </div>
    </div>
  );
}

function ActivityCard(props: {
  activity: (typeof AVAILABLE_ACTIVITIES)[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { activity, isSelected, onSelect } = props;

  return (
    <Card
      className={`flex cursor-pointer flex-col items-center p-4 transition-all hover:bg-accent ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <div
        className="mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
        style={{ backgroundColor: activity.color }}
      >
        {activity.icon}
      </div>
      <div className="text-center">
        <div className="font-medium">{activity.name}</div>
        <div className="text-sm text-muted-foreground">
          {activity.shortName}
        </div>
      </div>
    </Card>
  );
}
