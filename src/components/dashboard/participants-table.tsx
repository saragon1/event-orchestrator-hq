import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Hotel, Plane, Bus, Car, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

interface Person {
  id: string;
  name: string;
  email: string;
  role: string | null;
  phone: string | null;
}

interface FlightTicket {
  id: string;
  flight_id: string;
  person_id: string;
  seat?: string;
}

interface BusTicket {
  id: string;
  bus_id: string;
  person_id: string;
  seat?: string;
}

interface CarReservation {
  id: string;
  car_id: string;
  person_id: string;
}

interface ParticipantsTableProps {
  selectedEventId: string | null;
}

interface ParticipantWithStatus extends Person {
  hasHotel: boolean;
  flightTickets: FlightTicket[];
  busTickets: BusTicket[];
  carReservations: CarReservation[];
  hotelReservationId?: string | null;
}

interface ExtendedWindow extends Window {
  refreshParticipantsTable?: () => void;
}

export function ParticipantsTable({ selectedEventId }: ParticipantsTableProps) {
  const [participants, setParticipants] = useState<ParticipantWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  // Function to manually trigger refresh
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!selectedEventId) {
      setParticipants([]);
      return;
    }

    const fetchParticipants = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch all persons assigned to this event
        const { data: eventPersons, error: eventPersonsError } = await supabase
          .from('event_persons')
          .select('persons:person_id(*)')
          .eq('event_id', selectedEventId);

        if (eventPersonsError) throw eventPersonsError;

        const personsData = eventPersons?.map(item => item.persons) || [];

        // 2. Fetch hotel assignments
        const { data: eventHotels, error: eventHotelsError } = await supabase
          .from('event_hotels')
          .select('hotel_id')
          .eq('event_id', selectedEventId);

        if (eventHotelsError) throw eventHotelsError;

        // 3. Fetch hotel reservations for persons
        let hotelReservations = [];
        try {
          const { data, error } = await supabase
            .from('hotel_reservations')
            .select('id, person_id, hotel_id')
            .eq('event_id', selectedEventId);

          if (error) {
            console.warn('Error fetching hotel reservations:', error);
            // Continue execution, we'll just show no hotel reservations
          } else {
            hotelReservations = data || [];
          }
        } catch (error) {
          console.warn('Error fetching hotel reservations:', error);
          // Continue execution, we'll just show no hotel reservations
        }

        // 4. Fetch flight tickets with complete details
        const { data: flightTickets, error: flightTicketsError } = await supabase
          .from('flight_tickets')
          .select('id, flight_id, person_id, seat')
          .eq('event_id', selectedEventId);

        if (flightTicketsError) throw flightTicketsError;

        // 5. Fetch bus tickets with complete details
        const { data: busTickets, error: busTicketsError } = await supabase
          .from('bus_tickets')
          .select('id, bus_id, person_id, seat')
          .eq('event_id', selectedEventId);

        if (busTicketsError) throw busTicketsError;

        // 6. Fetch car reservations
        const { data: carReservations, error: carReservationsError } = await supabase
          .from('car_reservations')
          .select('id, car_id, person_id')
          .eq('event_id', selectedEventId);

        if (carReservationsError) throw carReservationsError;

        // Group tickets by person
        const flightTicketsByPerson = new Map<string, FlightTicket[]>();
        flightTickets?.forEach(ticket => {
          const personTickets = flightTicketsByPerson.get(ticket.person_id) || [];
          personTickets.push(ticket);
          flightTicketsByPerson.set(ticket.person_id, personTickets);
        });
        
        const busTicketsByPerson = new Map<string, BusTicket[]>();
        busTickets?.forEach(ticket => {
          const personTickets = busTicketsByPerson.get(ticket.person_id) || [];
          personTickets.push(ticket);
          busTicketsByPerson.set(ticket.person_id, personTickets);
        });
        
        // Create a map of person IDs to their hotel reservation IDs
        const hotelReservationByPerson = new Map<string, string>();
        hotelReservations?.forEach(reservation => {
          hotelReservationByPerson.set(reservation.person_id, reservation.id);
        });
        
        // Create sets for fast lookups for hotel
        const personsWithHotelReservations = new Set(hotelReservations?.map(r => r.person_id) || []);
        
        // Group car reservations by person
        const carReservationsByPerson = new Map<string, CarReservation[]>();
        carReservations?.forEach(reservation => {
          const personReservations = carReservationsByPerson.get(reservation.person_id) || [];
          personReservations.push(reservation);
          carReservationsByPerson.set(reservation.person_id, personReservations);
        });
        
        // Combine all data
        const enrichedParticipants = personsData.map(person => ({
          ...person,
          hasHotel: personsWithHotelReservations.has(person.id),
          hotelReservationId: hotelReservationByPerson.get(person.id) || null,
          flightTickets: flightTicketsByPerson.get(person.id) || [],
          busTickets: busTicketsByPerson.get(person.id) || [],
          carReservations: carReservationsByPerson.get(person.id) || []
        }));

        setParticipants(enrichedParticipants);
      } catch (error) {
        console.error('Error fetching participants data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch participants data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [selectedEventId, toast, refreshTrigger]);

  // Make the refreshData function available
  useEffect(() => {
    if (selectedEventId) {
      // Create a global function that can be called to refresh the participants table
      const extendedWindow = window as ExtendedWindow;
      extendedWindow.refreshParticipantsTable = refreshData;
      
      // Refresh when component mounts
      refreshData();
      
      return () => {
        // Clean up when component unmounts
        const extendedWindow = window as ExtendedWindow;
        delete extendedWindow.refreshParticipantsTable;
      };
    }
  }, [selectedEventId]);

  // Render hotel status icon with link
  const renderHotelStatus = (person: ParticipantWithStatus) => {
    if (person.hasHotel) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/hotel-reservations?person=${person.id}${person.hotelReservationId ? `&highlight=${person.hotelReservationId}` : ''}`}>
                <Hotel className="h-4 w-4 text-green-500 cursor-pointer hover:text-green-700" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>View hotel reservation for {person.name}</p>
              <p className="text-xs">Click to view details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <XCircle className="h-4 w-4 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>No hotel assigned</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  };

  // Render flight ticket icons
  const renderFlightTickets = (tickets: FlightTicket[]) => {
    if (tickets.length === 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <XCircle className="h-4 w-4 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>No flight tickets assigned</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div className="flex items-center justify-center gap-1">
        {tickets.map((ticket, index) => (
          <TooltipProvider key={ticket.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={`/flights/details/${ticket.flight_id}?ticket=${ticket.id}`}>
                  <Plane 
                    className={`h-4 w-4 cursor-pointer hover:text-blue-700 ${
                      tickets.length === 1 ? "text-yellow-500" : "text-blue-500"
                    }`} 
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Flight ticket {ticket.seat ? `- Seat: ${ticket.seat}` : ''}</p>
                <p className="text-xs">{tickets.length === 1 ? "Warning: Only one flight ticket" : ""}</p>
                <p className="text-xs">Click to view details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  // Render bus ticket icons
  const renderBusTickets = (tickets: BusTicket[]) => {
    if (tickets.length === 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <XCircle className="h-4 w-4 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>No bus tickets assigned</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div className="flex items-center justify-center gap-1">
        {tickets.map((ticket, index) => (
          <TooltipProvider key={ticket.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={`/buses/details/${ticket.bus_id}?ticket=${ticket.id}`}>
                  <Bus 
                    className={`h-4 w-4 cursor-pointer hover:text-green-700 ${
                      tickets.length === 1 ? "text-yellow-500" : "text-green-500"
                    }`} 
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bus ticket {ticket.seat ? `- Seat: ${ticket.seat}` : ''}</p>
                <p className="text-xs">{tickets.length === 1 ? "Warning: Only one bus ticket" : ""}</p>
                <p className="text-xs">Click to view details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  // Render car reservation icons
  const renderCarReservations = (reservations: CarReservation[]) => {
    if (reservations.length === 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <XCircle className="h-4 w-4 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>No car reservations assigned</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div className="flex items-center justify-center gap-1">
        {reservations.map((reservation, index) => (
          <TooltipProvider key={reservation.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={`/cars/details/${reservation.car_id}?reservation=${reservation.id}`}>
                  <Car 
                    className={`h-4 w-4 cursor-pointer hover:text-blue-700 ${
                      reservations.length === 1 ? "text-yellow-500" : "text-blue-500"
                    }`} 
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Car reservation</p>
                <p className="text-xs">{reservations.length === 1 ? "Warning: Only one car reservation" : ""}</p>
                <p className="text-xs">Click to view details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  if (!selectedEventId) {
    return (
      <div className="flex items-center justify-center p-6 h-[200px] bg-muted/20 rounded-md">
        <p className="text-muted-foreground">Select an event to view participants</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 h-[200px] bg-muted/20 rounded-md">
        <p className="text-muted-foreground">No participants found for this event</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center">
                <Hotel className="h-4 w-4 mr-1" /> Hotel
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center">
                <Plane className="h-4 w-4 mr-1" /> Flights
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center">
                <Bus className="h-4 w-4 mr-1" /> Buses
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center">
                <Car className="h-4 w-4 mr-1" /> Cars
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => (
            <TableRow key={participant.id}>
              <TableCell className="font-medium">{participant.name}</TableCell>
              <TableCell>{participant.email}</TableCell>
              <TableCell>{participant.role || '-'}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center">
                  {renderHotelStatus(participant)}
                </div>
              </TableCell>
              <TableCell className="text-center">
                {renderFlightTickets(participant.flightTickets)}
              </TableCell>
              <TableCell className="text-center">
                {renderBusTickets(participant.busTickets)}
              </TableCell>
              <TableCell className="text-center">
                {renderCarReservations(participant.carReservations)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 