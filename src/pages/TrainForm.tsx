import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEventStore } from "@/stores/event-store";

const formSchema = z.object({
  company: z.string().min(1, "Company is required"),
  trainNumber: z.string().min(1, "Train number is required"),
  departureStation: z.string().min(1, "Departure station is required"),
  arrivalStation: z.string().min(1, "Arrival station is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  arrivalTime: z.string().min(1, "Arrival time is required"),
  capacity: z.string().min(1, "Capacity is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Train {
  id: string;
  company: string;
  train_number: string;
  departure_station: string;
  arrival_station: string;
  departure_time: string;
  arrival_time: string;
  capacity: number;
  notes: string | null;
}

const TrainForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      trainNumber: "",
      departureStation: "",
      arrivalStation: "",
      departureTime: "",
      arrivalTime: "",
      capacity: "0",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchTrain = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("trains")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            company: data.company,
            trainNumber: data.train_number,
            departureStation: data.departure_station,
            arrivalStation: data.arrival_station,
            departureTime: new Date(data.departure_time).toISOString().slice(0, 16),
            arrivalTime: new Date(data.arrival_time).toISOString().slice(0, 16),
            capacity: data.capacity.toString(),
            notes: data.notes || "",
          });
        }
      } catch (error) {
        console.error("Error fetching train:", error);
        toast({
          title: "Error",
          description: "Could not fetch train details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrain();
  }, [id, form, toast]);

  const onSubmit = async (values: FormValues) => {
    if (!selectedEventId) {
      toast({
        title: "Error",
        description: "Please select an event first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const trainData = {
        company: values.company,
        train_number: values.trainNumber,
        departure_station: values.departureStation,
        arrival_station: values.arrivalStation,
        departure_time: values.departureTime,
        arrival_time: values.arrivalTime,
        capacity: parseInt(values.capacity),
        notes: values.notes || null,
        event_id: selectedEventId,
      };

      let response;
      if (id) {
        response = await supabase
          .from("trains")
          .update(trainData)
          .eq("id", id);
      } else {
        response = await supabase
          .from("trains")
          .insert(trainData);
      }

      if (response.error) throw response.error;

      toast({
        title: id ? "Train updated" : "Train created",
        description: id
          ? "Train has been successfully updated"
          : "New train has been successfully created",
      });

      navigate("/trains");
    } catch (error) {
      console.error("Error saving train:", error);
      toast({
        title: "Error",
        description: `Could not ${id ? "update" : "create"} train`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={id ? "Edit Train" : "Create Train"}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Amtrak" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trainNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Train Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departureStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Station</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrivalStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Station</FormLabel>
                      <FormControl>
                        <Input placeholder="Boston" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrivalTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="100"
                          {...field}
                          disabled={isLoading}
                        />
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
                        <Input placeholder="Additional information" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/trains")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : id ? "Update Train" : "Create Train"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default TrainForm; 