
import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEventStore } from '@/stores/event-store';

export const EventSelector = () => {
  const { events, selectedEventId, fetchEvents, setSelectedEventId } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <Select
      value={selectedEventId || undefined}
      onValueChange={setSelectedEventId}
    >
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select an event" />
      </SelectTrigger>
      <SelectContent>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.id}>
            {event.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
