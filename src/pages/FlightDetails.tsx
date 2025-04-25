
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEventStore } from "@/stores/event-store";
import { TicketFormModal } from "@/components/tickets/TicketFormModal";

interface Flight {
  id: string;
  airline: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
}

interface FlightTicket {
  id: string;
  person: { name: string };
  seat: string | null;
  confirmation_number: string | null;
  notes: string | null;
}

export default function FlightDetails() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [tickets, setTickets] = useState<FlightTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();
  const selectedEventId = useEventStore((state) => state.selectedEventId);

  const fetchFlight = async () => {
    if (!id || !selectedEventId) return;

    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('id', id)
      .eq('event_id', selectedEventId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Could not fetch flight details",
        variant: "destructive",
      });
      return;
    }

    setFlight(data);
  };

  const fetchTickets = async () => {
    if (!id || !selectedEventId) return;

    const { data, error } = await supabase
      .from('flight_tickets')
      .select(`
        id,
        seat,
        confirmation_number,
        notes,
        person:persons(name)
      `)
      .eq('flight_id', id)
      .eq('event_id', selectedEventId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not fetch tickets",
        variant: "destructive",
      });
      return;
    }

    setTickets(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFlight();
    fetchTickets();
  }, [id, selectedEventId]);

  const handleDelete = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('flight_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });

      fetchTickets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete ticket",
        variant: "destructive",
      });
    }
  };

  const handleOpenModal = (ticketId?: string) => {
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
  };

  if (!flight || !selectedEventId) {
    return (
      <DashboardLayout title="Flight Details">
        <div className="p-4">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Flight Details">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Details
          </CardTitle>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Ticket
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div>
              <h3 className="font-semibold">Airline</h3>
              <p>{flight.airline} - {flight.flight_number}</p>
            </div>
            <div>
              <h3 className="font-semibold">Departure</h3>
              <p>{flight.departure_airport} - {new Date(flight.departure_time).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">Arrival</h3>
              <p>{flight.arrival_airport} - {new Date(flight.arrival_time).toLocaleString()}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Passenger</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Confirmation</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.person?.name}</TableCell>
                  <TableCell>{ticket.seat || '-'}</TableCell>
                  <TableCell>{ticket.confirmation_number || '-'}</TableCell>
                  <TableCell>{ticket.notes || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenModal(ticket.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(ticket.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && (
        <TicketFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTicketId(undefined);
          }}
          type="flight"
          eventId={selectedEventId}
          transportId={id!}
          ticketId={selectedTicketId}
          onSuccess={fetchTickets}
        />
      )}
    </DashboardLayout>
  );
}
