import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Users, Plane, Bus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEventStore } from "@/stores/event-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch total counts and event-specific bookings
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

  const renderStatCard = (label, value, icon, color, className = '') => (
    <Card key={label} className={`animate-fade-in ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {React.createElement(icon, { className: `h-4 w-4 ${color}` })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  const openPersonManagementModal = () => setIsPersonModalOpen(true);
  const openHotelManagementModal = () => setIsHotelModalOpen(true);

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

        {/* First row of metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          {renderStatCard("Total Persons", stats.totalPersons, Users, "text-blue-500", "md:col-span-1")}
          {renderStatCard("Total Hotels", stats.totalHotels, Hotel, "text-purple-500", "md:col-span-1")}
        </div>

        {/* Second row of metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          {renderStatCard("Hotel Bookings", stats.hotelBookings, Hotel, "text-indigo-500")}
          {renderStatCard("Flight Tickets", stats.flightTickets, Plane, "text-green-500")}
          {renderStatCard("Bus Reservations", stats.busReservations, Bus, "text-orange-500")}
        </div>

        {/* Event Management Section */}
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
              {/* Placeholder for persons list or summary */}
              <p className="text-muted-foreground">
                {selectedEvent 
                  ? `${stats.hotelBookings} persons assigned to this event` 
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
              {/* Placeholder for hotels list or summary */}
              <p className="text-muted-foreground">
                {selectedEvent 
                  ? `${stats.hotelBookings} hotels assigned to this event` 
                  : "Select an event to manage hotels"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Persons Management Modal */}
        <Dialog open={isPersonModalOpen} onOpenChange={setIsPersonModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Manage Persons for {selectedEvent?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {/* Available Persons Panel */}
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-4">Available Persons</h3>
                {/* Implement list of available persons */}
              </div>
              
              {/* Assigned Persons Panel */}
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-4">Assigned Persons</h3>
                {/* Implement list of assigned persons */}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hotels Management Modal */}
        <Dialog open={isHotelModalOpen} onOpenChange={setIsHotelModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Manage Hotels for {selectedEvent?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {/* Available Hotels Panel */}
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-4">Available Hotels</h3>
                {/* Implement list of available hotels */}
              </div>
              
              {/* Assigned Hotels Panel */}
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-4">Assigned Hotels</h3>
                {/* Implement list of assigned hotels */}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
