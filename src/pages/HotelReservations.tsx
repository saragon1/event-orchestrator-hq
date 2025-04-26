import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Hotel, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEventStore } from "@/stores/event-store";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, cn } from "@/lib/utils";
import { HotelReservationFormModal } from "@/components/hotel-reservations/hotel-reservation-form-modal";
import React from "react";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";

interface HotelReservation {
  id: string;
  event_id: string;
  person_id: string;
  hotel_id: string;
  check_in: string;
  check_out: string;
  room_type: string;
  confirmation_number: string;
  notes: string;
  person: { name: string };
  hotel: { name: string };
}

export default function HotelReservations() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<HotelReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | undefined>();
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const selectedEvent = useEventStore((state) => 
    state.events.find(event => event.id === selectedEventId)
  );
  
  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const highlightedReservationId = queryParams.get('highlight');
  const personFilter = queryParams.get('person');
  
  // Reference for the highlighted row
  const highlightedRowRef = React.useRef<HTMLTableRowElement>(null);

  const fetchReservations = async () => {
    if (!selectedEventId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hotel_reservations')
        .select(`
          id,
          event_id,
          person_id,
          hotel_id,
          check_in,
          check_out,
          room_type,
          confirmation_number,
          notes,
          person:persons(id, name),
          hotel:hotels(id, name)
        `)
        .eq('event_id', selectedEventId)
        .order('check_in', { ascending: true });

      if (error) throw error;
      
      console.log('Fetched reservations:', data);
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching hotel reservations:', error);
      toast({
        title: "Error",
        description: "Failed to load hotel reservations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedEventId]);
  
  // Filter reservations if personFilter is provided
  useEffect(() => {
    if (personFilter) {
      setFilteredReservations(reservations.filter(res => res.person_id === personFilter));
    } else {
      setFilteredReservations(reservations);
    }
  }, [reservations, personFilter]);
  
  // Scroll to highlighted reservation when the component loads or reservations change
  useEffect(() => {
    if (highlightedReservationId && !isLoading && highlightedRowRef.current) {
      // Scroll the highlighted row into view with a smooth animation
      highlightedRowRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightedReservationId, filteredReservations, isLoading]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hotel_reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hotel reservation deleted successfully",
      });
      
      fetchReservations();
    } catch (error) {
      console.error('Error deleting hotel reservation:', error);
      toast({
        title: "Error",
        description: "Failed to delete hotel reservation",
        variant: "destructive",
      });
    }
  };

  const handleOpenModal = (reservationId?: string) => {
    setSelectedReservationId(reservationId);
    setIsModalOpen(true);
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Function to clear filters
  const clearFilters = () => {
    navigate('/hotel-reservations');
  };

  return (
    <DashboardLayout title="Hotel Reservations">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              {selectedEvent ? `Hotel Reservations for ${selectedEvent.name}` : "Hotel Reservations"}
            </CardTitle>
            {personFilter && (
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <p>Filtered by person: {filteredReservations[0]?.person?.name || personFilter}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="ml-2 h-6 px-2"
                >
                  Clear filter
                </Button>
              </div>
            )}
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
            disabled={!selectedEventId}
          >
            <Plus className="h-4 w-4" />
            Add Reservation
          </Button>
        </CardHeader>
        <CardContent>
          {!selectedEventId ? (
            <div className="flex justify-center items-center p-8 bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">Please select an event to view hotel reservations</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-muted-foreground">Loading reservations...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="flex justify-center items-center p-8 bg-muted/20 rounded-lg">
              
                {personFilter 
                  ? <p className="text-muted-foreground">No hotel reservations found for this person</p> 
                  : <EmptyPlaceholder
                      title="No hotel reservations found"
                      description="Add a hotel reservation to start managing hotel reservations"
                      icon={<Hotel className="h-8 w-8 text-muted-foreground" />}
                      action={{
                        label: "Add Reservation",
                        onClick: () => handleOpenModal()
                      }}
                    />
                  }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Nights</TableHead>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Confirmation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow 
                    key={reservation.id}
                    ref={reservation.id === highlightedReservationId ? highlightedRowRef : undefined}
                    className={cn({
                      'bg-green-100 dark:bg-green-950/30 border-l-4 border-l-green-500': reservation.id === highlightedReservationId,
                      'hover:bg-muted/50': reservation.id !== highlightedReservationId
                    })}
                  >
                    <TableCell>{reservation.person?.name}</TableCell>
                    <TableCell>{reservation.hotel?.name}</TableCell>
                    <TableCell>{formatDate(reservation.check_in)}</TableCell>
                    <TableCell>{formatDate(reservation.check_out)}</TableCell>
                    <TableCell>{calculateNights(reservation.check_in, reservation.check_out)}</TableCell>
                    <TableCell>{reservation.room_type || '-'}</TableCell>
                    <TableCell>{reservation.confirmation_number || '-'}</TableCell>
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
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <HotelReservationFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReservationId(undefined);
          }}
          reservationId={selectedReservationId}
          eventId={selectedEventId || ''}
          onSuccess={fetchReservations}
        />
      )}
    </DashboardLayout>
  );
} 