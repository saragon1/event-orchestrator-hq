
import { useState, useEffect } from "react";
import { DashboardStatsCard } from "./dashboard-stats-card";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Plane, Bus } from "lucide-react";

interface DashboardStatsProps {
  selectedEventId: string | null;
}

export const DashboardStats = ({ selectedEventId }: DashboardStatsProps) => {
  const [stats, setStats] = useState({
    hotelBookings: 0,
    flightTickets: 0,
    busReservations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [
          { count: hotelBookings },
          { count: flightTickets },
          { count: busReservations }
        ] = await Promise.all([
          supabase.from('hotel_reservations').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || ''),
          supabase.from('flight_tickets').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || ''),
          supabase.from('bus_tickets').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEventId || '')
        ]);

        setStats({
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

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <DashboardStatsCard
        title="Hotel Bookings"
        value={stats.hotelBookings}
        icon={Hotel}
        iconColor="text-indigo-500"
      />
      <DashboardStatsCard
        title="Flight Tickets"
        value={stats.flightTickets}
        icon={Plane}
        iconColor="text-green-500"
      />
      <DashboardStatsCard
        title="Bus Reservations"
        value={stats.busReservations}
        icon={Bus}
        iconColor="text-orange-500"
      />
    </div>
  );
};
