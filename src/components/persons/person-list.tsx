import { useState, useEffect } from "react";
import { useEventStore } from "@/stores/event-store";
import { supabase } from "@/integrations/supabase/client";
import { PersonCard } from "./person-card";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { UserPlus, Upload, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ExcelUpload } from "./ExcelUpload";
import { toast } from "@/components/ui/use-toast";

interface Person {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  hasHotel?: boolean;
  hasFlight?: boolean;
  hasBus?: boolean;
  hasCar?: boolean;
}

interface PersonListProps {
  onAdd: () => void;
}

export const PersonList = ({ onAdd }: PersonListProps) => {
  const navigate = useNavigate();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteConfirmPerson, setDeleteConfirmPerson] = useState<Person | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const [persons, setPersons] = useState<Person[]>([]);

  const fetchPersons = async () => {
    setIsLoading(true);
    try {
      const { data: personsData, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .ilike('name', `%${searchTerm}%`);

      if (personsError) throw personsError;

      if (selectedEventId && personsData) {
        const { data: reservations } = await supabase
          .from('hotel_reservations')
          .select('person_id')
          .eq('event_id', selectedEventId);

        const { data: flightTickets } = await supabase
          .from('flight_tickets')
          .select('person_id')
          .eq('event_id', selectedEventId);

        const { data: busTickets } = await supabase
          .from('bus_tickets')
          .select('person_id')
          .eq('event_id', selectedEventId);

        const { data: carReservations } = await supabase
          .from('car_reservations')
          .select('person_id')
          .eq('event_id', selectedEventId);

        const personsWithBookings = personsData.map(person => ({
          ...person,
          hasHotel: reservations?.some(r => r.person_id === person.id) || false,
          hasFlight: flightTickets?.some(t => t.person_id === person.id) || false,
          hasBus: busTickets?.some(t => t.person_id === person.id) || false,
          hasCar: carReservations?.some(r => r.person_id === person.id) || false,
        }));

        setPersons(personsWithBookings);
      } else if (personsData) {
        setPersons(personsData.map(person => ({
          ...person,
          hasHotel: false,
          hasFlight: false,
          hasBus: false,
          hasCar: false,
        })));
      }
    } catch (error) {
      console.error('Error fetching persons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, [searchTerm, selectedEventId]);

  const handleViewDetails = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleEdit = (id: string) => {
    navigate(`/persons/${id}`);
  };

  const handleDeleteConfirm = (person: Person) => {
    setDeleteConfirmPerson(person);
  };

  const handleDelete = async () => {
    if (!deleteConfirmPerson) return;
    
    setIsDeleting(true);
    try {
      // ######################################################################
      // ############# TODO: Implement cascade delete on Supabase #############
      // ######################################################################

      // Using RPC to call a database function that will handle cascaded deletion
      // If you don't have this function yet, we'll use multiple delete operations
      
      // Option 1: If you have a cascade delete function in Supabase
      /*
      const { error } = await supabase.rpc('delete_person_cascade', {
        person_id: deleteConfirmPerson.id
      });
      */
      
      // Option 2: Delete related records manually
      // This approach requires us to delete from all related tables
      
      // Delete hotel reservations
      if (deleteConfirmPerson.hasHotel) {
        await supabase
          .from('hotel_reservations')
          .delete()
          .eq('person_id', deleteConfirmPerson.id);
      }
      
      // Delete flight tickets
      if (deleteConfirmPerson.hasFlight) {
        await supabase
          .from('flight_tickets')
          .delete()
          .eq('person_id', deleteConfirmPerson.id);
      }
      
      // Delete bus tickets
      if (deleteConfirmPerson.hasBus) {
        await supabase
          .from('bus_tickets')
          .delete()
          .eq('person_id', deleteConfirmPerson.id);
      }
      
      // Delete car reservations
      if (deleteConfirmPerson.hasCar) {
        await supabase
          .from('car_reservations')
          .delete()
          .eq('person_id', deleteConfirmPerson.id);
      }
      
      // Finally delete the person
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', deleteConfirmPerson.id);
        
      if (error) throw error;
      
      // Update the UI by removing the deleted person
      setPersons(persons.filter(p => p.id !== deleteConfirmPerson.id));
      toast({
        title: "Person deleted",
        description: `${deleteConfirmPerson.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting person:', error);
      toast({
        title: "Error",
        description: "Failed to delete person. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmPerson(null);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search persons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
          <Button onClick={onAdd}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Person
          </Button>
        </div>
      </div>

      {persons.length === 0 ? (
        <EmptyPlaceholder
          title="No persons found"
          description={searchTerm ? "Try adjusting your search terms." : "Add persons to start managing their event logistics."}
          icon={<UserPlus className="h-8 w-8 text-muted-foreground" />}
          action={!searchTerm ? {
            label: "Add Person",
            onClick: onAdd,
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {persons.map((person) => (
            <PersonCard
              key={person.id}
              {...person}
              onViewDetails={() => handleViewDetails(person)}
              onEdit={() => handleEdit(person.id)}
              onDelete={() => handleDeleteConfirm(person)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!selectedPerson} onOpenChange={() => setSelectedPerson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPerson?.name}</DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Contact Information</h4>
                <p className="text-sm text-muted-foreground">{selectedPerson.email}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPerson.phone || 'No phone number provided'}
                </p>
              </div>
              {selectedPerson.role && (
                <div>
                  <h4 className="font-medium">Role</h4>
                  <p className="text-sm text-muted-foreground">{selectedPerson.role}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmPerson} onOpenChange={(open) => !open && setDeleteConfirmPerson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Person</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteConfirmPerson?.name}? This action cannot be undone.
              {(deleteConfirmPerson?.hasHotel || deleteConfirmPerson?.hasFlight || 
                deleteConfirmPerson?.hasBus || deleteConfirmPerson?.hasCar) && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-700">
                    This will also delete all associated reservations and tickets.
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmPerson(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExcelUpload
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchPersons}
      />
    </div>
  );
};
