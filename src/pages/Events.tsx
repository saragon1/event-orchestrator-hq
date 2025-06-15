import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Edit,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEventStore } from "@/stores/event-store";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];

// Format a date string in YYYY-MM-DD format to display format
const formatDbDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { setSelectedEventId } = useEventStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .ilike("name", `%${searchTerm}%`)
        .order("start_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Could not fetch events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event? This will also delete all related data.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Event deleted",
        description: "Event has been successfully deleted",
      });
      
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Could not delete event",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleSelectEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    toast({
      title: "Event selected",
      description: "You are now viewing data for this event",
    });
    navigate("/dashboard");
  };

  return (
    <DashboardLayout title="Events">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </form>
          <Button asChild>
            <Link to="/events/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-muted/20 animate-pulse rounded-md" />
            <div className="h-20 bg-muted/20 animate-pulse rounded-md" />
          </div>
        ) : events.length === 0 ? (
          <EmptyPlaceholder
            title="No events found"
            description={searchTerm ? "Try adjusting your search terms." : "Add your first event to get started."}
            icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
            action={!searchTerm ? {
              label: "Add Event",
              onClick: () => navigate("/events/new")
            } : undefined}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDbDate(event.start_date)} - {formatDbDate(event.end_date)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2"><strong>Location:</strong> {event.location}</p>
                  <p className="text-sm mb-2"><strong>Address:</strong> {event.address}</p>
                  {event.description && <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
                </CardContent>
                <CardFooter className="gap-2 justify-between flex-wrap">
                  <Button 
                    variant="outline" 
                    onClick={() => handleSelectEvent(event.id)}
                  >
                    Set as active
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" asChild>
                      <Link to={`/events/${event.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Events;
