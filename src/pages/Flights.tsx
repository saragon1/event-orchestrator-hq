
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plane, Plus, Edit, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEventStore } from "@/stores/event-store";

const Flights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedEventId = useEventStore((state) => state.selectedEventId);

  useEffect(() => {
    if (selectedEventId) {
      fetchFlights();
    }
  }, [selectedEventId]);

  const fetchFlights = async () => {
    try {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .eq("event_id", selectedEventId)
        .order("departure_time", { ascending: true });

      if (error) throw error;

      setFlights(data || []);
    } catch (error) {
      console.error("Error fetching flights:", error);
      toast({
        title: "Error",
        description: "Could not fetch flights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("flights")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFlights(flights.filter(flight => flight.id !== id));
      toast({
        title: "Flight deleted",
        description: "Flight has been successfully deleted",
      });
    } catch (error) {
      console.error("Error deleting flight:", error);
      toast({
        title: "Error",
        description: "Could not delete flight",
        variant: "destructive",
      });
    }
  };

  if (!selectedEventId) {
    return (
      <DashboardLayout title="Flights">
        <EmptyPlaceholder
          title="No event selected"
          description="Please select an event from the dropdown to view and manage flights."
          icon={<Plane className="h-8 w-8 text-muted-foreground" />}
        />
      </DashboardLayout>
    );
  }

  if (loading) {
    return <DashboardLayout title="Flights">Loading...</DashboardLayout>;
  }

  if (flights.length === 0) {
    return (
      <DashboardLayout title="Flights">
        <EmptyPlaceholder
          title="No flights added yet"
          description="Add flights to start managing air travel."
          icon={<Plane className="h-8 w-8 text-muted-foreground" />}
          action={{
            label: "Add Flight",
            onClick: () => navigate("/flights/new"),
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Flights">
      <div className="flex justify-end mb-6">
        <Button onClick={() => navigate("/flights/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Flight
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Airline</TableHead>
                <TableHead>Flight Number</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights.map((flight) => (
                <TableRow key={flight.id}>
                  <TableCell>{flight.airline}</TableCell>
                  <TableCell>{flight.flight_number}</TableCell>
                  <TableCell>{flight.departure_airport}</TableCell>
                  <TableCell>{flight.arrival_airport}</TableCell>
                  <TableCell>
                    {new Date(flight.departure_time).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(flight.arrival_time).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/flights/details/${flight.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/flights/${flight.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(flight.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Flights;
