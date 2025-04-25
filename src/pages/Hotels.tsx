
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { Button } from "@/components/ui/button";
import { Hotel, Eye, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const Hotels = () => {
  const navigate = useNavigate();
  const [selectedHotel, setSelectedHotel] = useState<any>(null);

  const { data: hotels, isLoading } = useQuery({
    queryKey: ['hotels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const handleAddHotel = () => {
    navigate("/hotels/new");
  };

  const handleEditHotel = (id: string) => {
    navigate(`/hotels/${id}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Hotels">
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Hotels">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleAddHotel}>
            <Hotel className="mr-2 h-4 w-4" />
            Add Hotel
          </Button>
        </div>

        {!hotels?.length ? (
          <EmptyPlaceholder
            title="No hotels added yet"
            description="Add hotels to start managing participant accommodations."
            icon={<Hotel className="h-8 w-8 text-muted-foreground" />}
            action={{
              label: "Add Hotel",
              onClick: handleAddHotel,
            }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotels.map((hotel) => (
                <TableRow key={hotel.id}>
                  <TableCell>{hotel.name}</TableCell>
                  <TableCell>{hotel.city}</TableCell>
                  <TableCell>{hotel.country}</TableCell>
                  <TableCell>{hotel.rating || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedHotel(hotel)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditHotel(hotel.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!selectedHotel} onOpenChange={() => setSelectedHotel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedHotel?.name}</DialogTitle>
          </DialogHeader>
          {selectedHotel && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Address</h4>
                <p className="text-sm text-muted-foreground">{selectedHotel.address}</p>
              </div>
              <div>
                <h4 className="font-medium">Contact</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedHotel.phone || 'No phone number provided'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedHotel.website || 'No website provided'}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Rating</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedHotel.rating ? `${selectedHotel.rating} stars` : 'No rating provided'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Hotels;
