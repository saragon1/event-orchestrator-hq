
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Users, Plane, Bus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEventStore } from "@/stores/event-store";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  persons: number;
  hotels: number;
  flights: number;
  buses: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    persons: 0,
    hotels: 0,
    flights: 0,
    buses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const selectedEvent = useEventStore((state) => 
    state.events.find(event => event.id === selectedEventId)
  );

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Get total persons count
        const { count: personsCount } = await supabase
          .from('persons')
          .select('*', { count: 'exact', head: true });

        // Get hotel reservations count for selected event
        const { count: hotelsCount } = await supabase
          .from('hotel_reservations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', selectedEventId || '');

        // Get flight tickets count for selected event
        const { count: flightsCount } = await supabase
          .from('flight_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', selectedEventId || '');

        // Get bus tickets count for selected event
        const { count: busesCount } = await supabase
          .from('bus_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', selectedEventId || '');

        setStats({
          persons: personsCount || 0,
          hotels: hotelsCount || 0,
          flights: flightsCount || 0,
          buses: busesCount || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [selectedEventId]);

  const statCards = [
    { label: "Total Persons", value: stats.persons, icon: Users, color: "text-blue-500" },
    { label: "Hotel Bookings", value: stats.hotels, icon: Hotel, color: "text-purple-500" },
    { label: "Flight Tickets", value: stats.flights, icon: Plane, color: "text-indigo-500" },
    { label: "Bus Reservations", value: stats.buses, icon: Bus, color: "text-green-500" },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {selectedEvent ? (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Current Event: {selectedEvent.name}
            </h2>
            <p className="text-muted-foreground mt-1">
              {selectedEvent.location} • {
                new Date(selectedEvent.start_date).toLocaleDateString()
              } to {
                new Date(selectedEvent.end_date).toLocaleDateString()
              }
            </p>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 p-4 rounded-lg">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              No Event Selected
            </h2>
            <p className="mt-1">
              Please select an event from the dropdown to view event-specific data.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedEvent ? `For event: ${selectedEvent.name}` : 'No event selected'}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 animate-fade-in" style={{animationDelay: "400ms"}}>
            <CardHeader>
              <CardTitle>Event Overview</CardTitle>
              <CardDescription>
                {selectedEvent 
                  ? `Details for ${selectedEvent.name}`
                  : 'Select an event to see details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEvent ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {selectedEvent.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-muted-foreground text-sm mt-1">{selectedEvent.location}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Date</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {new Date(selectedEvent.start_date).toLocaleDateString()} to {new Date(selectedEvent.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  Select an event from the dropdown to view details
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{animationDelay: "500ms"}}>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your event data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <a href="/persons" className="bg-muted px-4 py-3 rounded-md hover:bg-muted/80 transition-colors">
                    <div className="flex items-center mb-1">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="font-medium">Persons</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Manage attendees</span>
                  </a>
                  <a href="/hotels" className="bg-muted px-4 py-3 rounded-md hover:bg-muted/80 transition-colors">
                    <div className="flex items-center mb-1">
                      <Hotel className="h-4 w-4 mr-2" />
                      <span className="font-medium">Hotels</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Manage accommodations</span>
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a href="/flights" className="bg-muted px-4 py-3 rounded-md hover:bg-muted/80 transition-colors">
                    <div className="flex items-center mb-1">
                      <Plane className="h-4 w-4 mr-2" />
                      <span className="font-medium">Flights</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Manage travel</span>
                  </a>
                  <a href="/buses" className="bg-muted px-4 py-3 rounded-md hover:bg-muted/80 transition-colors">
                    <div className="flex items-center mb-1">
                      <Bus className="h-4 w-4 mr-2" />
                      <span className="font-medium">Buses</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Manage ground transit</span>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
