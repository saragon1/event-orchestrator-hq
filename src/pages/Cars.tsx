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
import { Car, Plus, Edit, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEventStore } from "@/stores/event-store";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface CarItem {
  id: string;
  type: 'private' | 'ncc' | 'taxi';
  company: string;
  driver_name: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  arrival_time: string;
  capacity: number;
  license_plate: string;
  reservations_count: number;
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

const Cars = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cars, setCars] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedEventId = useEventStore((state) => state.selectedEventId);

  useEffect(() => {
    if (selectedEventId) {
      fetchCars();
    }
  }, [selectedEventId]);

  const fetchCars = async () => {
    try {
      // Get cars with a count of reservations
      const { data, error } = await supabase
        .from("cars")
        .select(`
          *,
          reservations_count: car_reservations!inner(count)
        `, { count: 'exact' })
        .eq("event_id", selectedEventId)
        .order("departure_time", { ascending: true });

      if (error) throw error;

      // Transform the data to extract the reservation count
      const formattedData = data?.map(car => ({
        ...car,
        reservations_count: car.reservations_count?.[0]?.count || 0
      })) || [];

      setCars(formattedData);
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast({
        title: "Error",
        description: "Could not fetch cars",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Car deleted successfully",
      });

      fetchCars();
    } catch (error) {
      console.error("Error deleting car:", error);
      toast({
        title: "Error",
        description: "Failed to delete car",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (!selectedEventId) {
      return (
        <EmptyPlaceholder>
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Car className="h-10 w-10 text-muted-foreground mb-4" />
            <div className="text-xl font-medium mb-2">No event selected</div>
            <div className="text-sm text-muted-foreground mb-4">
              Please select an event to view cars
            </div>
          </div>
        </EmptyPlaceholder>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <p className="text-muted-foreground">Loading cars...</p>
        </div>
      );
    }

    if (cars.length === 0) {
      return (
        <EmptyPlaceholder>
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Car className="h-10 w-10 text-muted-foreground mb-4" />
            <div className="text-xl font-medium mb-2">No cars found</div>
            <div className="text-sm text-muted-foreground mb-4">
              Add a car to start managing transportation
            </div>
            <Button onClick={() => navigate("/cars/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Car
            </Button>
          </div>
        </EmptyPlaceholder>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Dropoff</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Passengers</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => {
            const { label, variant } = getCarTypeLabel(car.type);
            
            return (
              <TableRow key={car.id}>
                <TableCell>
                  <Badge variant={variant}>{label}</Badge>
                </TableCell>
                <TableCell>{car.company || '-'}</TableCell>
                <TableCell>{car.driver_name || '-'}</TableCell>
                <TableCell>
                  <div>{car.departure_location}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(car.departure_time)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{car.arrival_location}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(car.arrival_time)}
                  </div>
                </TableCell>
                <TableCell>{car.capacity}</TableCell>
                <TableCell>
                  {car.reservations_count} / {car.capacity}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/cars/details/${car.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/cars/${car.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(car.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <DashboardLayout title="Cars">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cars</h1>
        <Button 
          onClick={() => navigate("/cars/new")} 
          disabled={!selectedEventId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Car
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">{renderContent()}</CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Cars; 