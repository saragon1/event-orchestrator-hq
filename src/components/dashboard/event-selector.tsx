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
import { useTranslation } from '@/hooks/useTranslation';

export const EventSelector = () => {
  const { events, selectedEventId, fetchEvents, setSelectedEventId, isLoading } = useEventStore();
  const { t } = useTranslation();

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
        <SelectValue placeholder={t("common.selectEvent")} />
      </SelectTrigger>
      <SelectContent>
        {events.length === 0 ? (
          <SelectItem value="no-events" disabled>
            {t("common.noResults")}
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
