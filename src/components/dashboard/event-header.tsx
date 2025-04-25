
import { Calendar } from "lucide-react";

interface Event {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
}

interface EventHeaderProps {
  event: Event | undefined;
}

export const EventHeader = ({ event }: EventHeaderProps) => {
  if (!event) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 p-4 rounded-lg">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          No Event Selected
        </h2>
        <p className="mt-1">
          Please select an event from the dropdown to view event-specific data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Current Event: {event.name}
        </h2>
        <p className="text-muted-foreground mt-1">
          {event.location} • {new Date(event.start_date).toLocaleDateString()} to{" "}
          {new Date(event.end_date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};
