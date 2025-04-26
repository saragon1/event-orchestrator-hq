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
import { Train, Plus, Edit, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEventStore } from "@/stores/event-store";

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
  event_id: string;
}

const Trains = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trains, setTrains] = useState<TrainData[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedEventId = useEventStore((state) => state.selectedEventId);

  useEffect(() => {
    if (selectedEventId) {
      fetchTrains();
    }
  }, [selectedEventId]);

  const fetchTrains = async () => {
    try {
      const { data, error } = await supabase
        .from("trains")
        .select("*")
        .eq("event_id", selectedEventId)
        .order("departure_time", { ascending: true });

      if (error) throw error;

      setTrains(data || []);
    } catch (error) {
      console.error("Error fetching trains:", error);
      toast({
        title: "Error",
        description: "Could not fetch trains",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trains")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTrains(trains.filter(train => train.id !== id));
      toast({
        title: "Train deleted",
        description: "Train has been successfully deleted",
      });
    } catch (error) {
      console.error("Error deleting train:", error);
      toast({
        title: "Error",
        description: "Could not delete train",
        variant: "destructive",
      });
    }
  };

  if (!selectedEventId) {
    return (
      <DashboardLayout title="Trains">
        <EmptyPlaceholder
          title="No event selected"
          description="Please select an event from the dropdown to view and manage trains."
          icon={<Train className="h-8 w-8 text-muted-foreground" />}
        />
      </DashboardLayout>
    );
  }

  if (loading) {
    return <DashboardLayout title="Trains">Loading...</DashboardLayout>;
  }

  if (trains.length === 0) {
    return (
      <DashboardLayout title="Trains">
        <EmptyPlaceholder
          title="No trains added yet"
          description="Add trains to start managing rail travel."
          icon={<Train className="h-8 w-8 text-muted-foreground" />}
          action={{
            label: "Add Train",
            onClick: () => navigate("/trains/new"),
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Trains">
      <div className="flex justify-end mb-6">
        <Button onClick={() => navigate("/trains/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Train
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Train Number</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trains.map((train) => (
                <TableRow key={train.id}>
                  <TableCell>{train.company}</TableCell>
                  <TableCell>{train.train_number}</TableCell>
                  <TableCell>{train.departure_station}</TableCell>
                  <TableCell>{train.arrival_station}</TableCell>
                  <TableCell>
                    {new Date(train.departure_time).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(train.arrival_time).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/trains/details/${train.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/trains/${train.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(train.id)}
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

export default Trains; 