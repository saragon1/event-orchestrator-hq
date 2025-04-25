
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
import { Bus, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEventStore } from "@/stores/event-store";

const Buses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedEventId = useEventStore((state) => state.selectedEventId);

  useEffect(() => {
    if (selectedEventId) {
      fetchBuses();
    }
  }, [selectedEventId]);

  const fetchBuses = async () => {
    try {
      const { data, error } = await supabase
        .from("buses")
        .select("*")
        .eq("event_id", selectedEventId)
        .order("departure_time", { ascending: true });

      if (error) throw error;

      setBuses(data || []);
    } catch (error) {
      console.error("Error fetching buses:", error);
      toast({
        title: "Error",
        description: "Could not fetch buses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("buses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setBuses(buses.filter(bus => bus.id !== id));
      toast({
        title: "Bus deleted",
        description: "Bus has been successfully deleted",
      });
    } catch (error) {
      console.error("Error deleting bus:", error);
      toast({
        title: "Error",
        description: "Could not delete bus",
        variant: "destructive",
      });
    }
  };

  if (!selectedEventId) {
    return (
      <DashboardLayout title="Buses">
        <EmptyPlaceholder
          title="No event selected"
          description="Please select an event from the dropdown to view and manage buses."
          icon={<Bus className="h-8 w-8 text-muted-foreground" />}
        />
      </DashboardLayout>
    );
  }

  if (loading) {
    return <DashboardLayout title="Buses">Loading...</DashboardLayout>;
  }

  if (buses.length === 0) {
    return (
      <DashboardLayout title="Buses">
        <EmptyPlaceholder
          title="No buses added yet"
          description="Add buses to start managing ground transportation."
          icon={<Bus className="h-8 w-8 text-muted-foreground" />}
          action={{
            label: "Add Bus",
            onClick: () => navigate("/buses/new"),
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Buses">
      <div className="flex justify-end mb-6">
        <Button onClick={() => navigate("/buses/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bus
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buses.map((bus) => (
                <TableRow key={bus.id}>
                  <TableCell>{bus.company}</TableCell>
                  <TableCell>{bus.departure_location}</TableCell>
                  <TableCell>{bus.arrival_location}</TableCell>
                  <TableCell>
                    {new Date(bus.departure_time).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(bus.arrival_time).toLocaleString()}
                  </TableCell>
                  <TableCell>{bus.capacity}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/buses/${bus.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(bus.id)}
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

export default Buses;
