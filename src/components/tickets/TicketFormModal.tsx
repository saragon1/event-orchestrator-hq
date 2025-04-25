
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";

interface Person {
  id: string;
  name: string;
}

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'flight' | 'bus';
  eventId: string;
  transportId: string;
  ticketId?: string;
  onSuccess: () => void;
}

export function TicketFormModal({
  isOpen,
  onClose,
  type,
  eventId,
  transportId,
  ticketId,
  onSuccess
}: TicketFormModalProps) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      person_id: "",
      seat: "",
      confirmation_number: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchPersons = async () => {
      // Fetch persons associated with the event through the event_persons junction table
      const { data, error } = await supabase
        .from('event_persons')
        .select('person_id, persons:person_id(id, name)')
        .eq('event_id', eventId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch persons",
          variant: "destructive",
        });
        return;
      }
      
      // Transform the data to get a clean array of persons
      const personsData = data?.map(item => ({
        id: item.persons.id,
        name: item.persons.name
      })) || [];
      
      setPersons(personsData);
    };

    const fetchTicket = async () => {
      if (!ticketId) return;
      
      const table = type === 'flight' ? 'flight_tickets' : 'bus_tickets';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch ticket details",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        form.reset({
          person_id: data.person_id,
          seat: data.seat || "",
          confirmation_number: data.confirmation_number || "",
          notes: data.notes || "",
        });
      }
    };

    fetchPersons();
    fetchTicket();
  }, [eventId, ticketId, form, toast, type]);

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    
    try {
      const table = type === 'flight' ? 'flight_tickets' : 'bus_tickets';
      
      // Create the data object with the correct ID field based on ticket type
      const data = {
        person_id: values.person_id,
        event_id: eventId,
        seat: values.seat,
        confirmation_number: values.confirmation_number,
        notes: values.notes
      };

      // Add the appropriate ID field based on the ticket type
      if (type === 'flight') {
        // For flight tickets
        data['flight_id'] = transportId;
      } else {
        // For bus tickets
        data['bus_id'] = transportId;
      }
      
      if (ticketId) {
        // Update existing ticket
        const { error } = await supabase
          .from(table)
          .update(data)
          .eq('id', ticketId);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Ticket updated successfully",
        });
      } else {
        // Create new ticket
        const { error } = await supabase
          .from(table)
          .insert(data);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Ticket created successfully",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the ticket",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{ticketId ? "Edit" : "Add"} {type === 'flight' ? "Flight" : "Bus"} Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="person">Passenger</Label>
              <Select
                onValueChange={(value) => form.setValue("person_id", value)}
                value={form.watch("person_id")}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a passenger" />
                </SelectTrigger>
                <SelectContent>
                  {persons.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seat">Seat</Label>
              <Input
                id="seat"
                placeholder="e.g., 12A"
                {...form.register("seat")}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmation">Confirmation Number</Label>
              <Input
                id="confirmation"
                placeholder="e.g., ABC123"
                {...form.register("confirmation_number")}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information"
                {...form.register("notes")}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
