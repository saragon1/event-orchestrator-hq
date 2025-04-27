import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { useEventStore } from "@/stores/event-store";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, PieChart, Users, Hotel, Ticket, Calendar, ArrowUp, ArrowDown, Building, MapPin, CalendarCheck, Check, Clock, X, ChevronsUpDown } from "lucide-react";
import { DashboardStatsCard } from "@/components/dashboard/stats/dashboard-stats-card";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { ChartContainer } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

type Person = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  created_at?: string;
};

interface GlobalStatistics {
  totalEvents: number;
  totalParticipants: number;
  totalHotels: number;
  totalFlights: number;
  eventsByMonth: { name: string; count: number }[];
  participantStatusDistribution: { name: string; value: number }[];
  transportationDistribution: { name: string; value: number }[];
  topLocations: { name: string; count: number }[];
  hotelReservationTrend: { name: string; bookings: number }[];
  inviteStatusData: { name: string; value: number }[];
  persons: Person[];
}

interface EventStatistics {
  totalParticipants: number;
  confirmedParticipants: number;
  pendingParticipants: number;
  declinedParticipants: number;
  hotelBookingRate: number;
  transportationDistribution: { name: string; value: number }[];
  participantRoleDistribution: { name: string; value: number }[];
  inviteStatusData: { name: string; value: number }[];
  scheduleItemsByType: { name: string; count: number }[];
  persons: Person[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const Statistics = () => {
  const { toast } = useToast();
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const selectedEvent = useEventStore((state) => 
    state.events.find(event => event.id === selectedEventId)
  );
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [personFilterOpen, setPersonFilterOpen] = useState(false);
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [globalStats, setGlobalStats] = useState<GlobalStatistics>({
    totalEvents: 0,
    totalParticipants: 0,
    totalHotels: 0,
    totalFlights: 0,
    eventsByMonth: [],
    participantStatusDistribution: [],
    transportationDistribution: [],
    topLocations: [],
    hotelReservationTrend: [],
    inviteStatusData: [],
    persons: []
  });
  const [eventStats, setEventStats] = useState<EventStatistics>({
    totalParticipants: 0,
    confirmedParticipants: 0,
    pendingParticipants: 0,
    declinedParticipants: 0,
    hotelBookingRate: 0,
    transportationDistribution: [],
    participantRoleDistribution: [],
    inviteStatusData: [],
    scheduleItemsByType: [],
    persons: []
  });

  // Person filter functions
  const togglePersonFilter = (personId: string) => {
    setSelectedPersons(prev => {
      if (prev.includes(personId)) {
        return prev.filter(id => id !== personId);
      } else {
        return [...prev, personId];
      }
    });
  };

  // Fetch global statistics
  useEffect(() => {
    const fetchGlobalStats = async () => {
      setIsGlobalLoading(true);
      try {
        // Fetch persons data for filtering
        const { data: personsData } = await supabase
          .from('persons')
          .select('id, name, email');

        // Fetch total counts (These will be filtered client-side based on person and date filters)
        const [
          { data: eventsData },
          { count: totalPersons },
          { data: hotelsData },
          { data: flightsData },
          { data: eventPersonsData },
          { data: flightTicketsData },
          { data: trainTicketsData },
          { data: busTicketsData },
          { data: carReservationsData },
          { data: hotelReservationsData }
        ] = await Promise.all([
          supabase.from('events').select('id, name, location, start_date'),
          supabase.from('persons').select('*', { count: 'exact', head: true }),
          supabase.from('hotels').select('*'),
          supabase.from('flights').select('*'),
          supabase.from('event_persons').select('person_id, event_id, invite_status'),
          supabase.from('flight_tickets').select('person_id'),
          supabase.from('train_tickets').select('person_id'),
          supabase.from('bus_tickets').select('person_id'),
          supabase.from('car_reservations').select('person_id'),
          supabase.from('hotel_reservations').select('id, person_id, check_in, check_out')
        ]);

        // Filter data based on selected persons if any
        const filteredEventsData = eventsData || [];
        let filteredEventIds = filteredEventsData.map(event => event.id);
        let filteredPersonIds = personsData?.map(person => person.id) || [];
        
        // Filter by selected persons if any
        if (selectedPersons.length > 0) {
          // Get event IDs for selected persons
          const personEventIds = eventPersonsData
            ?.filter(ep => selectedPersons.includes(ep.person_id))
            .map(ep => ep.event_id) || [];
          
          filteredEventIds = filteredEventIds.filter(id => personEventIds.includes(id));
          filteredPersonIds = selectedPersons;
        }
        
        // Filter by date range if set
        if (dateRange?.from && dateRange?.to) {
          filteredEventsData.filter(event => {
            const eventDate = new Date(event.start_date);
            return eventDate >= dateRange.from! && eventDate <= dateRange.to!;
          });
        }
        
        // Calculate filtered counts
        const totalEvents = filteredEventIds.length;
        
        // Process events by month
        const eventsByMonth = processEventsByMonth(
          filteredEventsData.filter(event => filteredEventIds.includes(event.id))
        );

        // Fetch participant status distribution
        const filteredStatusData = eventPersonsData?.filter(item => 
          filteredPersonIds.includes(item.person_id) && 
          filteredEventIds.includes(item.event_id)
        ) || [];

        const statusCounts = {
          'waiting_invite': 0,
          'invited': 0,
          'confirmed': 0,
          'declined': 0
        };
        
        filteredStatusData.forEach(item => {
          const status = item.invite_status || 'waiting_invite';
          statusCounts[status as keyof typeof statusCounts]++;
        });

        const participantStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
          name: formatStatusName(name),
          value
        }));

        // Filter transportation data based on selected persons
        const filteredFlightTickets = selectedPersons.length > 0 
          ? flightTicketsData?.filter(ticket => selectedPersons.includes(ticket.person_id)).length || 0
          : flightTicketsData?.length || 0;
          
        const filteredTrainTickets = selectedPersons.length > 0 
          ? trainTicketsData?.filter(ticket => selectedPersons.includes(ticket.person_id)).length || 0
          : trainTicketsData?.length || 0;
          
        const filteredBusTickets = selectedPersons.length > 0 
          ? busTicketsData?.filter(ticket => selectedPersons.includes(ticket.person_id)).length || 0
          : busTicketsData?.length || 0;
          
        const filteredCarReservations = selectedPersons.length > 0 
          ? carReservationsData?.filter(res => selectedPersons.includes(res.person_id)).length || 0
          : carReservationsData?.length || 0;
          
        // Filter hotel reservations by selected persons
        const filteredHotelReservations = selectedPersons.length > 0
          ? hotelReservationsData?.filter(res => selectedPersons.includes(res.person_id)) || []
          : hotelReservationsData || [];

        const transportationDistribution = [
          { name: 'Flights', value: filteredFlightTickets },
          { name: 'Trains', value: filteredTrainTickets },
          { name: 'Buses', value: filteredBusTickets },
          { name: 'Cars', value: filteredCarReservations }
        ];

        // Top locations based on filtered events
        const locationCounts: Record<string, number> = {};
        filteredEventsData
          .filter(event => filteredEventIds.includes(event.id))
          .forEach(event => {
            locationCounts[event.location] = (locationCounts[event.location] || 0) + 1;
          });

        const topLocations = Object.entries(locationCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Generate hotel reservation trend
        const hotelReservationTrend = processHotelReservationTrend(filteredHotelReservations, dateRange);
        
        // Process invite status data for global stats
        const inviteStatusData = [
          { name: 'Waiting', value: statusCounts.waiting_invite },
          { name: 'Invited', value: statusCounts.invited },
          { name: 'Confirmed', value: statusCounts.confirmed },
          { name: 'Declined', value: statusCounts.declined }
        ];

        setGlobalStats({
          totalEvents,
          totalParticipants: selectedPersons.length > 0 ? selectedPersons.length : totalPersons || 0,
          totalHotels: hotelsData?.length || 0,
          totalFlights: filteredFlightTickets,
          eventsByMonth,
          participantStatusDistribution,
          transportationDistribution,
          topLocations,
          hotelReservationTrend,
          inviteStatusData,
          persons: personsData || []
        });
      } catch (error) {
        console.error("Error fetching global statistics:", error);
        toast({
          title: "Error",
          description: "Failed to fetch global statistics",
          variant: "destructive",
        });
      } finally {
        setIsGlobalLoading(false);
      }
    };

    fetchGlobalStats();
  }, [toast, selectedPersons, dateRange]);

  // Fetch event-specific statistics
  useEffect(() => {
    const fetchEventStats = async () => {
      if (!selectedEventId) {
        setIsEventLoading(false);
        return;
      }
      
      setIsEventLoading(true);
      try {
        // Fetch persons for this event
        const { data: eventPersons } = await supabase
          .from('event_persons')
          .select(`
            person_id,
            invite_status,
            event_role,
            persons (
              id,
              name,
              email
            )
          `)
          .eq('event_id', selectedEventId);
        
        // Extract person IDs and build a map for quick lookup
        const eventPersonIds = eventPersons?.map(ep => ep.person_id) || [];
        const personsData = eventPersons?.map(ep => ep.persons) || [];
        
        // Apply person filter if there are selected persons
        let filteredPersonIds = eventPersonIds;
        if (selectedPersons.length > 0) {
          filteredPersonIds = eventPersonIds.filter(id => selectedPersons.includes(id));
        }
        
        // Calculate participant counts by status
        const statusCounts = {
          waiting_invite: 0,
          invited: 0,
          confirmed: 0,
          declined: 0
        };
        
        eventPersons?.forEach(ep => {
          if (filteredPersonIds.includes(ep.person_id)) {
            const status = ep.invite_status || 'waiting_invite';
            statusCounts[status as keyof typeof statusCounts]++;
          }
        });
        
        // Calculate role distribution
        const roleCounts: Record<string, number> = {};
        eventPersons?.forEach(ep => {
          if (filteredPersonIds.includes(ep.person_id)) {
            const role = ep.event_role || 'Attendee';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
          }
        });
        
        const participantRoleDistribution = Object.entries(roleCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
        
        // Fetch transportation data
        const [
          { data: flightTickets },
          { data: trainTickets },
          { data: busTickets },
          { data: carReservations }
        ] = await Promise.all([
          supabase
            .from('flight_tickets')
            .select('id, person_id, flight_id')
            .eq('event_id', selectedEventId),
          supabase
            .from('train_tickets')
            .select('id, person_id, train_id')
            .eq('event_id', selectedEventId),
          supabase
            .from('bus_tickets')
            .select('id, person_id, bus_id')
            .eq('event_id', selectedEventId),
          supabase
            .from('car_reservations')
            .select('id, person_id, car_id')
            .eq('event_id', selectedEventId)
        ]);
        
        // Fetch hotel reservations
        const { data: hotelReservations } = await supabase
          .from('hotel_reservations')
          .select('id, person_id, hotel_id')
          .eq('event_id', selectedEventId);
        
        // Fetch schedule items
        const { data: scheduleItems } = await supabase
          .from('event_schedules')
          .select('id, schedule_type')
          .eq('event_id', selectedEventId);
        
        // Filter transportation data by selected persons
        const filteredFlightTickets = flightTickets?.filter(ticket => 
          filteredPersonIds.includes(ticket.person_id)) || [];
          
        const filteredTrainTickets = trainTickets?.filter(ticket => 
          filteredPersonIds.includes(ticket.person_id)) || [];
          
        const filteredBusTickets = busTickets?.filter(ticket => 
          filteredPersonIds.includes(ticket.person_id)) || [];
          
        const filteredCarReservations = carReservations?.filter(res => 
          filteredPersonIds.includes(res.person_id)) || [];
          
        const filteredHotelBookings = hotelReservations?.filter(booking => 
          filteredPersonIds.includes(booking.person_id)) || [];
        
        // Calculate transportation distribution
        const transportationDistribution = [
          { name: 'Flights', value: filteredFlightTickets.length },
          { name: 'Trains', value: filteredTrainTickets.length },
          { name: 'Buses', value: filteredBusTickets.length },
          { name: 'Cars', value: filteredCarReservations.length }
        ];
        
        // Calculate hotel booking rate
        const hotelBookingRate = filteredPersonIds.length > 0 
          ? filteredHotelBookings.length / filteredPersonIds.length 
          : 0;
        
        // Process schedule items by type
        const scheduleItemCounts: Record<string, number> = {};
        scheduleItems?.forEach(item => {
          const type = item.schedule_type || 'Other';
          scheduleItemCounts[type] = (scheduleItemCounts[type] || 0) + 1;
        });
        
        const scheduleItemsByType = Object.entries(scheduleItemCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        
        // Generate invite status over time (past 7 days)
        const inviteStatusData = [
          { name: 'Waiting', value: statusCounts.waiting_invite },
          { name: 'Invited', value: statusCounts.invited },
          { name: 'Confirmed', value: statusCounts.confirmed },
          { name: 'Declined', value: statusCounts.declined }
        ];
        
        setEventStats({
          totalParticipants: filteredPersonIds.length,
          confirmedParticipants: statusCounts.confirmed,
          pendingParticipants: statusCounts.waiting_invite + statusCounts.invited,
          declinedParticipants: statusCounts.declined,
          hotelBookingRate,
          transportationDistribution,
          participantRoleDistribution,
          inviteStatusData,
          scheduleItemsByType,
          persons: personsData as Person[]
        });
      } catch (error) {
        console.error("Error fetching event statistics:", error);
        toast({
          title: "Error",
          description: "Failed to fetch event statistics",
          variant: "destructive",
        });
      } finally {
        setIsEventLoading(false);
      }
    };
    
    fetchEventStats();
  }, [selectedEventId, toast, selectedPersons]);

  // Helper function to process events by month
  const processEventsByMonth = (events: { start_date: string }[]) => {
    const monthCounts: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    events.forEach(event => {
      const date = new Date(event.start_date);
      const monthName = months[date.getMonth()];
      monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
    });
    
    return months.map(month => ({
      name: month,
      count: monthCounts[month] || 0
    }));
  };

  // Format status name for display
  const formatStatusName = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Process hotel reservations to get trend data
  const processHotelReservationTrend = (reservations: { check_in: string }[], range?: DateRange) => {
    // If no reservations, return empty data
    if (!reservations.length) {
      return [];
    }
    
    const monthCounts: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Filter reservations by date range if provided
    let filteredReservations = [...reservations];
    
    if (range?.from && range?.to) {
      // Filter reservations within the selected date range
      filteredReservations = reservations.filter(reservation => {
        const checkInDate = new Date(reservation.check_in);
        return checkInDate >= range.from! && checkInDate <= range.to!;
      });
    }
    
    // If no reservations after filtering or no date range, use last 6 months as default
    if (!filteredReservations.length || !range?.from) {
      const today = new Date();
      const currentMonthIndex = today.getMonth();
      
      // Create an array of the last 6 months (including current)
      const lastSixMonths = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonthIndex - i + 12) % 12; // Handle wrap around to previous year
        lastSixMonths.push(months[monthIndex]);
      }
      
      // Initialize counts for each month with zero
      lastSixMonths.forEach(month => {
        monthCounts[month] = 0;
      });
      
      // Count reservations per month (from the original set)
      reservations.forEach(reservation => {
        const date = new Date(reservation.check_in);
        const monthName = months[date.getMonth()];
        // Only count if it's in our 6-month window
        if (lastSixMonths.includes(monthName)) {
          monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
        }
      });
      
      // Return data for default 6-month range
      return lastSixMonths.map(month => ({
        name: month,
        bookings: monthCounts[month]
      }));
    }
    
    // If we have a date range and reservations, process them by month
    // Find min and max dates to determine the range of months to show
    const dates = filteredReservations.map(r => new Date(r.check_in));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Create array of month names in the range
    const monthsInRange = [];
    const currentDate = new Date(minDate);
    currentDate.setDate(1); // Start at beginning of month
    
    while (currentDate <= maxDate) {
      monthsInRange.push(months[currentDate.getMonth()]);
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      // Prevent infinite loop if something goes wrong
      if (monthsInRange.length > 24) break;
    }
    
    // Initialize counts for each month with zero
    monthsInRange.forEach(month => {
      monthCounts[month] = 0;
    });
    
    // Count reservations per month
    filteredReservations.forEach(reservation => {
      const date = new Date(reservation.check_in);
      const monthName = months[date.getMonth()];
      monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
    });
    
    // Convert to the format needed for the chart
    return monthsInRange.map(month => ({
      name: month,
      bookings: monthCounts[month]
    }));
  };

  // Check if there's an event selected for the event-specific tab
  const hasEventSelected = !!selectedEventId;

  return (
    <DashboardLayout title="Statistics Dashboard">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Statistics Dashboard</h1>
        </div>

        <Tabs defaultValue="global" className="space-y-4">
          <TabsList>
            <TabsTrigger value="global">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Global Statistics
            </TabsTrigger>
            <TabsTrigger value="event" disabled={!hasEventSelected}>
              <PieChart className="h-4 w-4 mr-2" />
              {hasEventSelected ? `${selectedEvent?.name} Statistics` : 'Event Statistics'}
            </TabsTrigger>
          </TabsList>

          {/* Global Statistics Tab */}
          <TabsContent value="global" className="space-y-4">
            {isGlobalLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[200px] w-full" />
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  <Skeleton className="h-[100px] w-full" />
                  <Skeleton className="h-[100px] w-full" />
                  <Skeleton className="h-[100px] w-full" />
                  <Skeleton className="h-[100px] w-full" />
                </div>
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <>
                {/* Filters Section */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {/* Person Filter */}
                  <div className="w-64">
                    <Popover open={personFilterOpen} onOpenChange={setPersonFilterOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={personFilterOpen}
                          className="w-full justify-between"
                        >
                          {selectedPersons.length > 0
                            ? `${selectedPersons.length} person${selectedPersons.length > 1 ? 's' : ''} selected`
                            : "Filter by person"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 z-[1000]">
                        <Command>
                          <CommandInput placeholder="Search person..." />
                          <CommandList>
                            <CommandEmpty>No person found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-auto">
                              {globalStats.persons.map((person) => (
                                <CommandItem
                                  key={person.id}
                                  value={person.id}
                                  onSelect={() => togglePersonFilter(person.id)}
                                  className="flex items-center"
                                >
                                  <div className={cn(
                                    "mr-2 h-4 w-4 rounded-sm border flex items-center justify-center", 
                                    selectedPersons.includes(person.id) ? "bg-primary border-primary" : "border-input"
                                  )}>
                                    {selectedPersons.includes(person.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <span>{person.name}</span>
                                  <span className="ml-auto text-xs text-muted-foreground">{person.email}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                          {selectedPersons.length > 0 && (
                            <div className="border-t p-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full" 
                                onClick={() => setSelectedPersons([])}
                              >
                                Clear selection
                              </Button>
                            </div>
                          )}
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedPersons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedPersons.map(id => {
                          const person = globalStats.persons.find(p => p.id === id);
                          return person && (
                            <Badge key={id} variant="secondary" className="gap-1">
                              {person.name}
                              <button 
                                onClick={() => togglePersonFilter(id)} 
                                className="ml-1 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Date Range Filter */}
                  <div className="w-64">
                    <DateRangePicker
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      showCompactText={true}
                    />
                  </div>
                  
                  {/* Reset Filters Button - only show if filters are applied */}
                  {(selectedPersons.length > 0 || dateRange) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPersons([]);
                        setDateRange(undefined);
                      }}
                      className="h-10"
                    >
                      Reset Filters
                    </Button>
                  )}
                </div>

                {/* Top level statistics */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  <DashboardStatsCard
                    title="Total Events"
                    value={globalStats.totalEvents}
                    icon={Calendar}
                    iconColor="text-blue-500"
                  />
                  <DashboardStatsCard
                    title="Total Participants"
                    value={globalStats.totalParticipants}
                    icon={Users}
                    iconColor="text-green-500"
                  />
                  <DashboardStatsCard
                    title="Hotels"
                    value={globalStats.totalHotels}
                    icon={Hotel}
                    iconColor="text-purple-500"
                  />
                  <DashboardStatsCard
                    title="Flights"
                    value={globalStats.totalFlights}
                    icon={Ticket}
                    iconColor="text-amber-500"
                  />
                </div>

                {/* Events by Month */}
                <Card>
                  <CardHeader>
                    <CardTitle>Events by Month</CardTitle>
                    <CardDescription>Number of events scheduled each month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={globalStats.eventsByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#8884d8" name="Events" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts Row */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {/* Participant Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Participant Status</CardTitle>
                      <CardDescription>Distribution of participant invitation statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={globalStats.participantStatusDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {globalStats.participantStatusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transportation Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Transportation Methods</CardTitle>
                      <CardDescription>Distribution of transportation methods used</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={globalStats.transportationDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {globalStats.transportationDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* More Charts Row */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {/* Top Locations */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Event Locations</CardTitle>
                      <CardDescription>Most popular locations for events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={globalStats.topLocations}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#82ca9d" name="Events" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hotel Reservation Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Hotel Reservation Trend</CardTitle>
                      <CardDescription>
                        {dateRange?.from && dateRange?.to 
                          ? `Reservations from ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`
                          : 'Number of hotel reservations in the last 6 months'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={globalStats.hotelReservationTrend}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="bookings" 
                              stroke="#8884d8" 
                              name="Hotel Bookings"
                              activeDot={{ r: 8 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Event Statistics Tab */}
          <TabsContent value="event" className="space-y-4">
            {!selectedEventId ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Event Selected</CardTitle>
                  <CardDescription>Please select an event to view its statistics</CardDescription>
                </CardHeader>
              </Card>
            ) : isEventLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[100px] w-full" />
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  <Skeleton className="h-[100px] w-full" />
                  <Skeleton className="h-[100px] w-full" />
                  <Skeleton className="h-[100px] w-full" />
                  <Skeleton className="h-[100px] w-full" />
                </div>
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <>
                {/* Person Filter for Event Tab */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="w-64">
                    <Popover open={personFilterOpen} onOpenChange={setPersonFilterOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={personFilterOpen}
                          className="w-full justify-between"
                        >
                          {selectedPersons.length > 0
                            ? `${selectedPersons.length} person${selectedPersons.length > 1 ? 's' : ''} selected`
                            : "Filter by person"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 z-[1000]">
                        <Command>
                          <CommandInput placeholder="Search person..." />
                          <CommandList>
                            <CommandEmpty>No person found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-auto">
                              {eventStats.persons.map((person) => (
                                <CommandItem
                                  key={person.id}
                                  value={person.id}
                                  onSelect={() => togglePersonFilter(person.id)}
                                  className="flex items-center"
                                >
                                  <div className={cn(
                                    "mr-2 h-4 w-4 rounded-sm border flex items-center justify-center", 
                                    selectedPersons.includes(person.id) ? "bg-primary border-primary" : "border-input"
                                  )}>
                                    {selectedPersons.includes(person.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <span>{person.name}</span>
                                  <span className="ml-auto text-xs text-muted-foreground">{person.email}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                          {selectedPersons.length > 0 && (
                            <div className="border-t p-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full" 
                                onClick={() => setSelectedPersons([])}
                              >
                                Clear selection
                              </Button>
                            </div>
                          )}
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedPersons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedPersons.map(id => {
                          const person = eventStats.persons.find(p => p.id === id);
                          return person && (
                            <Badge key={id} variant="secondary" className="gap-1">
                              {person.name}
                              <button 
                                onClick={() => togglePersonFilter(id)} 
                                className="ml-1 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Date Range Filter */}
                  <div className="w-64">
                    <DateRangePicker
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      showCompactText={true}
                    />
                  </div>
                </div>

                {/* Event info card */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedEvent?.name}</CardTitle>
                    <CardDescription>Event details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedEvent ? (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <CalendarCheck className="h-4 w-4 mr-2" />
                          <span>
                            {format(new Date(selectedEvent.start_date), 'MMM dd, yyyy')} - {format(new Date(selectedEvent.end_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{selectedEvent.location}</span>
                        </div>
                      </div>
                    ) : 'No event data available'}
                  </CardContent>
                </Card>

                {/* Participant statistics */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="flex flex-col p-4 bg-white shadow-sm rounded-lg border">
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Total Participants</span>
                    </div>
                    <div className="text-3xl font-bold">
                      {eventStats.totalParticipants}
                    </div>
                  </Card>
                  
                  <Card className="flex flex-col p-4 bg-white shadow-sm rounded-lg border">
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Check className="h-4 w-4 mr-2" />
                      <span>Confirmed</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {eventStats.confirmedParticipants}
                    </div>
                  </Card>
                  
                  <Card className="flex flex-col p-4 bg-white shadow-sm rounded-lg border">
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Pending</span>
                    </div>
                    <div className="text-3xl font-bold text-amber-600">
                      {eventStats.pendingParticipants}
                    </div>
                  </Card>
                  
                  <Card className="flex flex-col p-4 bg-white shadow-sm rounded-lg border">
                    <div className="flex items-center text-muted-foreground mb-1">
                      <X className="h-4 w-4 mr-2" />
                      <span>Declined</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      {eventStats.declinedParticipants}
                    </div>
                  </Card>
                </div>

                {/* Hotel booking rate */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Hotel Booking Rate</CardTitle>
                    <CardDescription>Percentage of participants with hotel reservations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-4xl font-bold">
                        {(eventStats.hotelBookingRate * 100).toFixed(1)}%
                      </div>
                      <Badge 
                        variant={eventStats.hotelBookingRate > 0.7 ? "default" : 
                                eventStats.hotelBookingRate > 0.5 ? "secondary" : "destructive"}
                        className="flex items-center"
                      >
                        {eventStats.hotelBookingRate > 0.7 ? <ArrowUp className="mr-1 h-3 w-3" /> : 
                         eventStats.hotelBookingRate > 0.5 ? <ArrowUp className="mr-1 h-3 w-3" /> : 
                         <ArrowDown className="mr-1 h-3 w-3" />}
                        {eventStats.hotelBookingRate > 0.7 ? "Good" : 
                         eventStats.hotelBookingRate > 0.5 ? "Average" : "Low"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts Row */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {/* Participant Role Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Participant Roles</CardTitle>
                      <CardDescription>Distribution of participant roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={eventStats.participantRoleDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {eventStats.participantRoleDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transportation Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Transportation Methods</CardTitle>
                      <CardDescription>Distribution of transportation methods for this event</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={eventStats.transportationDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {eventStats.transportationDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* More Charts Row */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {/* Schedule Items by Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Schedule Items by Type</CardTitle>
                      <CardDescription>Types of scheduled items for this event</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={eventStats.scheduleItemsByType}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#82ca9d" name="Items" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Invite Status Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Invite Status Distribution</CardTitle>
                      <CardDescription>Distribution of participant invitation statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={eventStats.inviteStatusData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" name="Participants" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Statistics; 