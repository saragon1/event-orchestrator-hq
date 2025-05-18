import { useState, useEffect } from "react";
import { useEventStore } from "@/stores/event-store";
import { supabase } from "@/integrations/supabase/client";
import { PersonCard } from "./person-card";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { UserPlus, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExcelUpload } from "./ExcelUpload";

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

      <ExcelUpload
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchPersons}
      />
    </div>
  );
};
