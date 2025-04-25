import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Plus, Pencil, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Car {
  id: string;
  type: string;
  company: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  arrival_time: string;
  driver_name: string;
  driver_phone: string;
  license_plate: string;
  capacity: number;
}

interface CarReservation {
  id: string;
  person: { name: string };
  confirmation_number: string | null;
  notes: string | null;
}

const getCarTypeLabel = (type: string) => {
  switch (type) {
    case 'private':
      return { label: 'Private', variant: 'default' as const };
    case 'ncc':
      return { label: 'NCC', variant: 'outline' as const };
    case 'taxi':
      return { label: 'Taxi', variant: 'secondary' as const };
    default:
      return { label: type, variant: 'outline' as const };
  }
};

export default function CarDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const [car, setCar] = useState<Car | null>(null);
  const [reservations, setReservations] = useState<CarReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | undefined>();
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  
  // Extract reservation ID from query parameter
  const highlightedReservationId = new URLSearchParams(location.search).get('reservation');

  // Reference for the highlighted row
  const highlightedRowRef = React.useRef<HTMLTableRowElement>(null);

  const fetchCar = async () => {
    if (!id || !selectedEventId) return;

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .eq('event_id', selectedEventId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Could not fetch car details",
        variant: "destructive",
      });
      return;
    }

    setCar(data);
  };

  const fetchReservations = async () => {
    if (!id || !selectedEventId) return;

    const { data, error } = await supabase
      .from('car_reservations')
      .select(`
        id,
        confirmation_number,
        notes,
        person:persons(name)
      `)
      .eq('car_id', id)
      .eq('event_id', selectedEventId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not fetch reservations",
        variant: "destructive",
      });
      return;
    }

    setReservations(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCar();
    fetchReservations();
  }, [id, selectedEventId]);

  // Scroll to highlighted reservation when the component loads or reservations change
  useEffect(() => {
    if (highlightedReservationId && !isLoading && highlightedRowRef.current) {
      // Scroll the highlighted row into view with a smooth animation
      highlightedRowRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightedReservationId, reservations, isLoading]);

  const handleDelete = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('car_reservations')
        .delete()
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reservation deleted successfully",
      });

      fetchReservations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete reservation",
        variant: "destructive",
      });
    }
  };

  const handleOpenModal = (reservationId?: string) => {
    setSelectedReservationId(reservationId);
    setIsModalOpen(true);
  };

  if (!car || !selectedEventId) {
    return (
      <DashboardLayout title="Car Details">
        <div className="p-4">Loading...</div>
      </DashboardLayout>
    );
  }

  const { label, variant } = getCarTypeLabel(car.type);

  return (
    <DashboardLayout title="Car Details">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Car Details
          </CardTitle>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Reservation
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div>
              <h3 className="font-semibold">Car Type</h3>
              <Badge variant={variant}>{label}</Badge>
            </div>
            <div>
              <h3 className="font-semibold">Company / Driver</h3>
              <p>{car.company} / {car.driver_name}</p>
            </div>
            <div>
              <h3 className="font-semibold">Driver Phone</h3>
              <p>{car.driver_phone || '-'}</p>
            </div>
            <div>
              <h3 className="font-semibold">License Plate</h3>
              <p>{car.license_plate}</p>
            </div>
            <div>
              <h3 className="font-semibold">Capacity</h3>
              <p>{car.capacity} passengers</p>
            </div>
            <div>
              <h3 className="font-semibold">Departure</h3>
              <p>{car.departure_location} - {formatDate(car.departure_time)}</p>
            </div>
            <div>
              <h3 className="font-semibold">Arrival</h3>
              <p>{car.arrival_location} - {formatDate(car.departure_time)}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Passenger</TableHead>
                <TableHead>Confirmation</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow 
                  key={reservation.id}
                  ref={reservation.id === highlightedReservationId ? highlightedRowRef : undefined}
                  className={cn({
                    'bg-blue-100 dark:bg-blue-950/30 border-l-4 border-l-blue-500': reservation.id === highlightedReservationId,
                    'hover:bg-muted/50': reservation.id !== highlightedReservationId
                  })}
                >
                  <TableCell>{reservation.person?.name}</TableCell>
                  <TableCell>{reservation.confirmation_number || '-'}</TableCell>
                  <TableCell>{reservation.notes || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenModal(reservation.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(reservation.id)}
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
            setSelectedReservationId(undefined);
          }}
          type="car"
          eventId={selectedEventId}
          transportId={id!}
          ticketId={selectedReservationId}
          onSuccess={fetchReservations}
        />
      )}
    </DashboardLayout>
  );
} 