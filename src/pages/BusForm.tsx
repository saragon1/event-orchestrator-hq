
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

const formSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  departureLocation: z.string().min(1, "Departure location is required"),
  arrivalLocation: z.string().min(1, "Arrival location is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  arrivalTime: z.string().min(1, "Arrival time is required"),
  capacity: z.string().min(1, "Capacity is required"),
});

type FormValues = z.infer<typeof formSchema>;

const BusForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      departureLocation: "",
      arrivalLocation: "",
      departureTime: "",
      arrivalTime: "",
      capacity: "",
    },
  });

  useEffect(() => {
    const fetchBus = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("buses")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            company: data.company,
            departureLocation: data.departure_location,
            arrivalLocation: data.arrival_location,
            departureTime: new Date(data.departure_time).toISOString().slice(0, 16),
            arrivalTime: new Date(data.arrival_time).toISOString().slice(0, 16),
            capacity: data.capacity.toString(),
          });
        }
      } catch (error) {
        console.error("Error fetching bus:", error);
        toast({
          title: "Error",
          description: "Could not fetch bus details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBus();
  }, [id, form, toast]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const busData = {
        company: values.company,
        departure_location: values.departureLocation,
        arrival_location: values.arrivalLocation,
        departure_time: values.departureTime,
        arrival_time: values.arrivalTime,
        capacity: parseInt(values.capacity),
        event_id: "00000000-0000-0000-0000-000000000000", // TODO: Get from context
      };

      let response;
      if (id) {
        response = await supabase
          .from("buses")
          .update(busData)
          .eq("id", id);
      } else {
        response = await supabase
          .from("buses")
          .insert([busData]);
      }

      if (response.error) throw response.error;

      toast({
        title: id ? "Bus updated" : "Bus created",
        description: id
          ? "Bus has been successfully updated"
          : "New bus has been successfully created",
      });

      navigate("/buses");
    } catch (error) {
      console.error("Error saving bus:", error);
      toast({
        title: "Error",
        description: `Could not ${id ? "update" : "create"} bus`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={id ? "Edit Bus" : "Create Bus"}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Greyhound" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departureLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Location</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrivalLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Location</FormLabel>
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

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="50"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/buses")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : id ? "Update Bus" : "Create Bus"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default BusForm;
