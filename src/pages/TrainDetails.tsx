import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Train, Plus, Pencil, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import React from "react";

interface TrainData {
  id: string;
  company: string;
  train_number: string;
  departure_station: string;
  arrival_station: string;
  departure_time: string;
  arrival_time: string;
  capacity: number;
  notes: string | null;
}

interface TrainTicket {
  id: string;
  person: { name: string };
  confirmation_number: string | null;
  seat: string | null;
  notes: string | null;
}

export default function TrainDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const [train, setTrain] = useState<TrainData | null>(null);
  const [tickets, setTickets] = useState<TrainTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  
  // Extract ticket ID from query parameter
  const highlightedTicketId = new URLSearchParams(location.search).get('ticket');

  // Reference for the highlighted row
  const highlightedRowRef = React.useRef<HTMLTableRowElement>(null);

  const fetchTrain = async () => {
    if (!id || !selectedEventId) return;

    const { data, error } = await supabase
      .from('trains')
      .select('*')
      .eq('id', id)
      .eq('event_id', selectedEventId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Could not fetch train details",
        variant: "destructive",
      });
      return;
    }

    setTrain(data);
  };

  const fetchTickets = async () => {
    if (!id || !selectedEventId) return;

    const { data, error } = await supabase
      .from('train_tickets')
      .select(`
        id,
        seat,
        confirmation_number,
        notes,
        person:persons(name)
      `)
      .eq('train_id', id)
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
    fetchTrain();
    fetchTickets();
  }, [id, selectedEventId]);

  // Scroll to highlighted ticket when the component loads or tickets change
  useEffect(() => {
    if (highlightedTicketId && !isLoading && highlightedRowRef.current) {
      // Scroll the highlighted row into view with a smooth animation
      highlightedRowRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightedTicketId, tickets, isLoading]);

  const handleDelete = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('train_tickets')
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

  if (!train || !selectedEventId) {
    return (
      <DashboardLayout title="Train Details">
        <div className="p-4">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Train Details">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Train className="h-5 w-5" />
            Train Details
          </CardTitle>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Ticket
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div>
              <h3 className="font-semibold">Company</h3>
              <p>{train.company} - {train.train_number}</p>
            </div>
            <div>
              <h3 className="font-semibold">Departure</h3>
              <p>{train.departure_station} - {new Date(train.departure_time).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">Arrival</h3>
              <p>{train.arrival_station} - {new Date(train.arrival_time).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">Capacity</h3>
              <p>{train.capacity} passengers</p>
            </div>
            {train.notes && (
              <div className="col-span-full">
                <h3 className="font-semibold">Notes</h3>
                <p>{train.notes}</p>
              </div>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Passenger</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Confirmation #</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow 
                  key={ticket.id}
                  ref={ticket.id === highlightedTicketId ? highlightedRowRef : undefined}
                  className={cn({
                    'bg-blue-100 dark:bg-blue-950/30 border-l-4 border-l-blue-500': ticket.id === highlightedTicketId,
                    'hover:bg-muted/50': ticket.id !== highlightedTicketId
                  })}
                >
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
          type="train"
          eventId={selectedEventId}
          transportId={id!}
          ticketId={selectedTicketId}
          onSuccess={fetchTickets}
        />
      )}
    </DashboardLayout>
  );
} 