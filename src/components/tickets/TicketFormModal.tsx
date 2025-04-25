
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  person_id: z.string().min(1, "Person is required"),
  seat: z.string().optional(),
  confirmation_number: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'flight' | 'bus';
  eventId: string;
  transportId: string;
  ticketId?: string;
  onSuccess: () => void;
}

export const TicketFormModal = ({
  isOpen,
  onClose,
  type,
  eventId,
  transportId,
  ticketId,
  onSuccess,
}: TicketFormModalProps) => {
  const { toast } = useToast();
  const [persons, setPersons] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      person_id: "",
      seat: "",
      confirmation_number: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchPersons = async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('id, name')
        .eq('id', eventId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch persons",
          variant: "destructive",
        });
        return;
      }
      
      setPersons(data || []);
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

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    const table = type === 'flight' ? 'flight_tickets' : 'bus_tickets';
    const transportField = type === 'flight' ? 'flight_id' : 'bus_id';

    try {
      const ticketData = {
        person_id: values.person_id,
        [transportField]: transportId,
        event_id: eventId,
        seat: values.seat || null,
        confirmation_number: values.confirmation_number || null,
        notes: values.notes || null,
      };

      let response;
      if (ticketId) {
        response = await supabase
          .from(table)
          .update(ticketData)
          .eq('id', ticketId);
      } else {
        response = await supabase
          .from(table)
          .insert([ticketData]);
      }

      if (response.error) throw response.error;

      toast({
        title: ticketId ? "Ticket updated" : "Ticket created",
        description: ticketId
          ? "Ticket has been successfully updated"
          : "New ticket has been successfully created",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving ticket:", error);
      toast({
        title: "Error",
        description: `Could not ${ticketId ? "update" : "create"} ticket`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ticketId ? "Edit Ticket" : "Create Ticket"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="person_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a person" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {persons.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seat (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="A1" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmation_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC123" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any additional notes" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : ticketId ? "Update Ticket" : "Create Ticket"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
