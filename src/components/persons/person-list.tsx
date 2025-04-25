
import { useState } from "react";
import { PersonCard } from "./person-card";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Mock data for development
const MOCK_PERSONS = [
  {
    id: "1",
    name: "Jane Cooper",
    email: "jane.cooper@example.com",
    role: "Speaker",
    hasHotel: true,
    hasFlight: true,
    hasBus: false,
  },
  {
    id: "2",
    name: "John Smith",
    email: "john.smith@example.com",
    role: "Attendee",
    hasHotel: true,
    hasFlight: false,
    hasBus: true,
  },
  {
    id: "3",
    name: "Robert Johnson",
    email: "robert.johnson@example.com",
    role: "Staff",
    hasHotel: false,
    hasFlight: true,
    hasBus: true,
  },
];

export const PersonList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [persons] = useState(MOCK_PERSONS);

  const filteredPersons = persons.filter((person) =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPerson = () => {
    // This would open a modal or navigate to a form
    console.log("Add person clicked");
  };

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
          title="No persons added"
          description="Add persons to start managing their event logistics."
          icon={<UserPlus className="h-8 w-8 text-muted-foreground" />}
          action={{
            label: "Add Person",
            onClick: handleAddPerson,
          }}
        />
      ) : filteredPersons.length === 0 ? (
        <EmptyPlaceholder
          title="No results found"
          description="Try adjusting your search terms."
          className="border-none"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersons.map((person) => (
            <PersonCard
              key={person.id}
              id={person.id}
              name={person.name}
              email={person.email}
              role={person.role}
              hasHotel={person.hasHotel}
              hasFlight={person.hasFlight}
              hasBus={person.hasBus}
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
