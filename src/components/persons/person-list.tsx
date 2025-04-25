
import { useState, useEffect } from "react";
import { useEventStore } from "@/stores/event-store";
import { supabase } from "@/integrations/supabase/client";
import { PersonCard } from "./person-card";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Person {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export const PersonList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const selectedEventId = useEventStore((state) => state.selectedEventId);

  useEffect(() => {
    const fetchPersons = async () => {
      setIsLoading(true);
      try {
        // First, get all persons
        const { data: personsData, error: personsError } = await supabase
          .from('persons')
          .select('*')
          .ilike('name', `%${searchTerm}%`);

        if (personsError) throw personsError;

        // If an event is selected, fetch all related data
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

          const personsWithBookings = personsData.map(person => ({
            ...person,
            hasHotel: reservations?.some(r => r.person_id === person.id) || false,
            hasFlight: flightTickets?.some(t => t.person_id === person.id) || false,
            hasBus: busTickets?.some(t => t.person_id === person.id) || false,
          }));

          setPersons(personsWithBookings);
        } else {
          setPersons(personsData.map(person => ({
            ...person,
            hasHotel: false,
            hasFlight: false,
            hasBus: false,
          })));
        }
      } catch (error) {
        console.error('Error fetching persons:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersons();
  }, [searchTerm, selectedEventId]);

  const handleAddPerson = () => {
    // This would open a modal or navigate to a form
    console.log("Add person clicked");
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
        <Button onClick={handleAddPerson}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      {persons.length === 0 ? (
        <EmptyPlaceholder
          title="No persons found"
          description={searchTerm ? "Try adjusting your search terms." : "Add persons to start managing their event logistics."}
          icon={<UserPlus className="h-8 w-8 text-muted-foreground" />}
          action={!searchTerm ? {
            label: "Add Person",
            onClick: handleAddPerson,
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {persons.map((person) => (
            <PersonCard
              key={person.id}
              {...person}
              onViewDetails={() => {
                console.log(`View details for ${person.name}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
