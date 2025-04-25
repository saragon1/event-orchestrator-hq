
import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventStore } from '@/stores/event-store';

export const EventSelector = () => {
  const { events, selectedEventId, fetchEvents, setSelectedEventId, isLoading } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (isLoading) {
    return <Skeleton className="w-[250px] h-10" />;
  }

  return (
    <Select
      value={selectedEventId || undefined}
      onValueChange={setSelectedEventId}
    >
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select an event" />
      </SelectTrigger>
      <SelectContent>
        {events.length === 0 ? (
          <SelectItem value="no-events" disabled>
            No events available
          </SelectItem>
        ) : (
          events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              {event.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};
