import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, Plus, Pencil, Trash2 } from "lucide-react";
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
import { useTranslation } from "@/hooks/useTranslation";

interface Bus {
  id: string;
  company: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  arrival_time: string;
  capacity: number;
}

interface BusTicket {
  id: string;
  person: { name: string };
  seat: string | null;
  confirmation_number: string | null;
  notes: string | null;
}

export default function BusDetails() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const [bus, setBus] = useState<Bus | null>(null);
  const [tickets, setTickets] = useState<BusTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  
  // Extract ticket ID from query parameter
  const highlightedTicketId = new URLSearchParams(location.search).get('ticket');

  // Reference for the highlighted row
  const highlightedRowRef = React.useRef<HTMLTableRowElement>(null);

  const fetchBus = async () => {
    if (!id || !selectedEventId) return;

    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .eq('id', id)
      .eq('event_id', selectedEventId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Could not fetch bus details",
        variant: "destructive",
      });
      return;
    }

    setBus(data);
  };

  const fetchTickets = async () => {
    if (!id || !selectedEventId) return;

    const { data, error } = await supabase
      .from('bus_tickets')
      .select(`
        id,
        seat,
        confirmation_number,
        notes,
        person:persons(name)
      `)
      .eq('bus_id', id)
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
    fetchBus();
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
        .from('bus_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("common.ticketDeletedSuccessfully"),
      });

      fetchTickets();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.couldNotDeleteTicket"),
        variant: "destructive",
      });
    }
  };

  const handleOpenModal = (ticketId?: string) => {
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
  };

  if (!bus || !selectedEventId) {
    return (
      <DashboardLayout title={t("buses.busDetails")}>
        <div className="p-4">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("buses.busDetails")}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            {t("buses.busDetails")}
          </CardTitle>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("common.addTicket")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div>
              <h3 className="font-semibold">{t("buses.company")}</h3>
              <p>{bus.company}</p>
            </div>
            <div>
              <h3 className="font-semibold">{t("buses.departure")}</h3>
              <p>{bus.departure_location} - {new Date(bus.departure_time).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">{t("buses.arrival")}</h3>
              <p>{bus.arrival_location} - {new Date(bus.arrival_time).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">{t("buses.capacity")}</h3>
              <p>{bus.capacity} {t("common.seats")}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.passenger")}</TableHead>
                <TableHead>{t("common.seat")}</TableHead>
                <TableHead>{t("common.confirmation")}</TableHead>
                <TableHead>{t("common.notes")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow 
                  key={ticket.id}
                  ref={ticket.id === highlightedTicketId ? highlightedRowRef : undefined}
                  className={cn({
                    'bg-green-100 dark:bg-green-950/30 border-l-4 border-l-green-500': ticket.id === highlightedTicketId,
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
          type="bus"
          eventId={selectedEventId}
          transportId={id!}
          ticketId={selectedTicketId}
          onSuccess={fetchTickets}
        />
      )}
    </DashboardLayout>
  );
}
