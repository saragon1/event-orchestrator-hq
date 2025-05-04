import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";

type ExpenseCategory = Database["public"]["Enums"]["event_expenses_category"];

interface Ticket {
  id: string;
  person_id: string;
  person_name: string;
  resource_id: string;
  resource_details: {
    type: string;
    name: string;
    departure?: string;
    arrival?: string;
    check_in?: string;
    check_out?: string;
  };
  date: string;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: {
    id: string;
    type: string;
    description: string;
    amount: number;
    date: string;
    resource_id: string | null;
    category: ExpenseCategory;
  } | null;
  eventId: string;
  onSuccess: (expense: {
    id: string;
    type: string;
    description: string;
    amount: number;
    date: string;
    resource_id: string | null;
    category: ExpenseCategory;
  }) => void;
}

const EXPENSE_TYPES = [
  "flight",
  "train",
  "bus",
  "car",
  "hotel",
  "other"
];

const OTHER_CATEGORIES: ExpenseCategory[] = [
  "transportation",
  "accomodation",
  "food",
  "services",
  "materials",
  "other"
];

export function ExpenseFormModal({
  isOpen,
  onClose,
  expense,
  eventId,
  onSuccess
}: ExpenseFormModalProps) {
  const { toast } = useToast();
  const [type, setType] = useState(expense?.type || "");
  const [description, setDescription] = useState(expense?.description || "");
  const [amount, setAmount] = useState(expense?.amount?.toString() || "");
  const [date, setDate] = useState(expense?.date || format(new Date(), "yyyy-MM-dd"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(expense?.resource_id || null);
  const [otherCategory, setOtherCategory] = useState<ExpenseCategory>("other");
  const [customOther, setCustomOther] = useState("");

  useEffect(() => {
    if (expense) {
      setType(expense.type);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setDate(expense.date);
      setSelectedTicket(expense.resource_id);
      if (expense.type === "other") {
        setOtherCategory(expense.category);
      }
    } else {
      setType("");
      setDescription("");
      setAmount("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setSelectedTicket(null);
      setOtherCategory("other");
      setCustomOther("");
    }
  }, [expense]);

  useEffect(() => {
    if (type && type !== "other") {
      fetchTickets();
    }
  }, [type]);

  const fetchTickets = async () => {
    try {
      let data;
      let error;

      switch (type) {
        case "flight":
          ({ data, error } = await supabase
            .from("flight_tickets")
            .select(`
              id,
              person_id,
              persons(name),
              flight_id,
              flights(airline, departure_airport, arrival_airport, departure_time)
            `)
            .eq("event_id", eventId));
          break;
        case "train":
          ({ data, error } = await supabase
            .from("train_tickets")
            .select(`
              id,
              person_id,
              persons(name),
              train_id,
              trains(company, departure_station, arrival_station, departure_time)
            `)
            .eq("event_id", eventId));
          break;
        case "bus":
          ({ data, error } = await supabase
            .from("bus_tickets")
            .select(`
              id,
              person_id,
              persons(name),
              bus_id,
              buses(company, departure_location, arrival_location, departure_time)
            `)
            .eq("event_id", eventId));
          break;
        case "car":
          ({ data, error } = await supabase
            .from("car_reservations")
            .select(`
              id,
              person_id,
              persons(name),
              car_id,
              cars(company, departure_location, arrival_location, departure_time)
            `)
            .eq("event_id", eventId));
          break;
        case "hotel":
          ({ data, error } = await supabase
            .from("hotel_reservations")
            .select(`
              id,
              person_id,
              persons(name),
              hotel_id,
              hotels(name),
              check_in,
              check_out
            `)
            .eq("event_id", eventId));
          break;
        default:
          return;
      }

      if (error) throw error;

      const formattedTickets = data.map((ticket: any) => {
        const resource = type === "hotel" ? ticket.hotels : 
                        type === "flight" ? ticket.flights :
                        type === "train" ? ticket.trains :
                        type === "bus" ? ticket.buses :
                        ticket.cars;

        return {
          id: ticket.id,
          person_id: ticket.person_id,
          person_name: ticket.persons.name,
          resource_id: type === "hotel" ? ticket.hotel_id :
                      type === "flight" ? ticket.flight_id :
                      type === "train" ? ticket.train_id :
                      type === "bus" ? ticket.bus_id :
                      ticket.car_id,
          resource_details: {
            type,
            name: type === "hotel" ? resource.name :
                  type === "flight" ? `${resource.airline} ${resource.departure_airport}-${resource.arrival_airport}` :
                  type === "train" ? `${resource.company} ${resource.departure_station}-${resource.arrival_station}` :
                  `${resource.company} ${resource.departure_location}-${resource.arrival_location}`,
            departure: type === "hotel" ? ticket.check_in :
                      resource.departure_time,
            arrival: type === "hotel" ? ticket.check_out :
                    null
          },
          date: type === "hotel" ? ticket.check_in :
                resource.departure_time
        };
      });

      setTickets(formattedTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tickets",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalDescription = description;
      let finalCategory: ExpenseCategory;

      // Set category based on type
      if (type === "hotel") {
        finalCategory = "accomodation";
      } else if (["flight", "train", "bus", "car"].includes(type)) {
        finalCategory = "transportation";
      } else {
        finalCategory = type === "other" ? otherCategory : type as ExpenseCategory;
      }

      if (type === "other") {
        const category = otherCategory === "other" && customOther
          ? customOther
          : otherCategory;
        finalDescription = `${category}${description ? ` - ${description}` : ''}`;
      }

      const expenseData: Database["public"]["Tables"]["event_expenses"]["Insert"] = {
        event_id: eventId,
        type,
        category: finalCategory,
        description: finalDescription,
        amount: parseFloat(amount),
        date,
        resource_id: selectedTicket,
      };

      if (expense) {
        // Update existing expense
        const { data, error } = await supabase
          .from("event_expenses")
          .update(expenseData)
          .eq("id", expense.id)
          .select()
          .single();

        if (error) throw error;
        onSuccess(data);
      } else {
        // Create new expense
        const { data, error } = await supabase
          .from("event_expenses")
          .insert(expenseData)
          .select()
          .single();

        if (error) throw error;
        onSuccess(data);
      }

      toast({
        title: "Success",
        description: `Expense ${expense ? "updated" : "created"} successfully`,
      });
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: `Failed to ${expense ? "update" : "create"} expense`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {expense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type && type !== "other" && (
            <div className="space-y-2">
              <Label htmlFor="ticket">Ticket/Reservation</Label>
              <Select value={selectedTicket || ""} onValueChange={setSelectedTicket}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket/reservation" />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map((ticket) => (
                    <SelectItem key={ticket.id} value={ticket.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{ticket.person_name}</span>
                        <span className="text-sm text-gray-500">{ticket.resource_details.name}</span>
                        <span className="text-xs text-gray-400">
                          {type === "hotel" 
                            ? `${format(new Date(ticket.resource_details.departure), "PPP")} - ${format(new Date(ticket.resource_details.arrival), "PPP")}`
                            : format(new Date(ticket.date), "PPP")}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "other" && (
            <div className="space-y-2">
              <Label htmlFor="other-category">Categoria spesa</Label>
              <Select value={otherCategory} onValueChange={(value: ExpenseCategory) => setOtherCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {OTHER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {otherCategory === "other" && (
                <Input
                  className="mt-2"
                  placeholder="Inserisci categoria personalizzata"
                  value={customOther}
                  onChange={e => setCustomOther(e.target.value)}
                  required
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inserisci dettagli della spesa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : expense ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 