import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Users, Plane, Bus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEventStore } from "@/stores/event-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ResourceManagementModal } from "@/components/resource-management/resource-management-modal";
import { useEventManagement } from "@/hooks/use-event-management";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPersons: 0,
    totalHotels: 0,
    hotelBookings: 0,
    flightTickets: 0,
    busReservations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const selectedEvent = useEventStore((state) => 
    state.events.find(event => event.id === selectedEventId)
  );

  const {
    availablePersons,
    assignedPersons,
    availableHotels,
    assignedHotels,
    fetchAvailablePersons,
    fetchAssignedPersons,
    assignPersonToEvent,
    removePersonFromEvent,
    fetchAvailableHotels,
    fetchAssignedHotels,
    assignHotelToEvent,
    removeHotelFromEvent,
  } = useEventManagement(selectedEventId || '');

  useEffect(() => {
    if (selectedEventId) {
      fetchAvailablePersons();
      fetchAssignedPersons();
      fetchAvailableHotels();
      fetchAssignedHotels();
    }
  }, [selectedEventId]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [
          { count: totalPersons },
          { count: totalHotels },
          { count: hotelBookings },
          { count: flightTickets },
          { count: busReservations }
        ] = await Promise.all([
          supabase.from('persons').select('*', { count: 'exact', head: true }),
          supabase.from('hotels').select('*', { count: 'exact', head: true }),
          supabase.from('hotel_reservations').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || ''),
          supabase.from('flight_tickets').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || ''),
          supabase.from('bus_tickets').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || '')
        ]);

        setStats({
          totalPersons: totalPersons || 0,
          totalHotels: totalHotels || 0,
          hotelBookings: hotelBookings || 0,
          flightTickets: flightTickets || 0,
          busReservations: busReservations || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [selectedEventId]);

  const openPersonManagementModal = () => {
    if (selectedEventId) {
      setIsPersonModalOpen(true);
    }
  };

  const openHotelManagementModal = () => {
    if (selectedEventId) {
      setIsHotelModalOpen(true);
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {selectedEvent ? (
          <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
            <div>
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Persons</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPersons}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hotels</CardTitle>
              <Hotel className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHotels}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hotel Bookings</CardTitle>
              <Hotel className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hotelBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flight Tickets</CardTitle>
              <Plane className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.flightTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bus Reservations</CardTitle>
              <Bus className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.busReservations}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Persons
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={openPersonManagementModal}
                  disabled={!selectedEvent}
                >
                  Manage
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {selectedEvent 
                  ? `${assignedPersons.length} persons assigned to this event` 
                  : "Select an event to manage persons"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Hotels
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={openHotelManagementModal}
                  disabled={!selectedEvent}
                >
                  Manage
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {selectedEvent 
                  ? `${assignedHotels.length} hotels assigned to this event` 
                  : "Select an event to manage hotels"}
              </p>
            </CardContent>
          </Card>
        </div>

        <ResourceManagementModal
          title={`Manage Persons for ${selectedEvent?.name}`}
          isOpen={isPersonModalOpen}
          onClose={() => setIsPersonModalOpen(false)}
          availableResources={availablePersons}
          assignedResources={assignedPersons}
          onAssign={assignPersonToEvent}
          onRemove={removePersonFromEvent}
          resourceType="person"
        />

        <ResourceManagementModal
          title={`Manage Hotels for ${selectedEvent?.name}`}
          isOpen={isHotelModalOpen}
          onClose={() => setIsHotelModalOpen(false)}
          availableResources={availableHotels}
          assignedResources={assignedHotels}
          onAssign={assignHotelToEvent}
          onRemove={removeHotelFromEvent}
          resourceType="hotel"
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
