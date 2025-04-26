import { useState, useEffect } from "react";
import { DashboardStatsCard } from "./dashboard-stats-card";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Plane, Bus, Car, Train } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStatsProps {
  selectedEventId: string | null;
}

export const DashboardStats = ({ selectedEventId }: DashboardStatsProps) => {
  const [stats, setStats] = useState({
    hotelBookings: 0,
    travelTickets: 0,
    busReservations: 0,
    carReservations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [
          { count: hotelBookings },
          { count: flightTickets },
          { count: trainTickets },
          { count: busReservations },
          { count: carReservations }
        ] = await Promise.all([
          supabase.from('hotel_reservations').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || ''),
          supabase.from('flight_tickets').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || ''),
          supabase.from('train_tickets').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || ''),
          supabase.from('bus_tickets').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || ''),
          supabase.from('car_reservations').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || '')
        ]);

        setStats({
          hotelBookings: hotelBookings || 0,
          travelTickets: (flightTickets || 0) + (trainTickets || 0),
          busReservations: busReservations || 0,
          carReservations: carReservations || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [selectedEventId]);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <DashboardStatsCard
        title="Hotel Bookings"
        value={stats.hotelBookings}
        icon={Hotel}
        iconColor="text-indigo-500"
      />
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Travel Tickets</CardTitle>
          <div className="flex">
            <Plane className="h-4 w-4 text-green-500 mr-1" />
            <Train className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.travelTickets}</div>
        </CardContent>
      </Card>
      <DashboardStatsCard
        title="Bus Reservations"
        value={stats.busReservations}
        icon={Bus}
        iconColor="text-orange-500"
      />
      <DashboardStatsCard
        title="Car Reservations"
        value={stats.carReservations}
        icon={Car}
        iconColor="text-blue-500"
      />
    </div>
  );
};
