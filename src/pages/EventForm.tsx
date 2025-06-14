import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { EventDocumentManager } from "@/components/EventDocuments/EventDocumentManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date({
    required_error: "End date is required",
  }),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  description: z.string().optional(),
}).refine(data => data.end_date >= data.start_date, {
  message: "End date must be on or after start date",
  path: ["end_date"],
});

type FormValues = z.infer<typeof formSchema>;

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      address: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          // Create dates at noon UTC to avoid timezone issues
          const startDate = new Date(`${data.start_date}T12:00:00Z`);
          const endDate = new Date(`${data.end_date}T12:00:00Z`);
          
          form.reset({
            name: data.name,
            start_date: startDate,
            end_date: endDate,
            location: data.location,
            address: data.address || "",
            description: data.description || "",
          });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast({
          title: "Error",
          description: "Could not fetch event details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, form, toast]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      // Format dates as YYYY-MM-DD for Supabase, ensuring we get the correct date
      // regardless of the user's timezone
      const startDate = new Date(values.start_date);
      const endDate = new Date(values.end_date);
      
      // Get UTC year, month, day
      const startYear = startDate.getUTCFullYear();
      const startMonth = String(startDate.getUTCMonth() + 1).padStart(2, '0');
      const startDay = String(startDate.getUTCDate()).padStart(2, '0');
      
      const endYear = endDate.getUTCFullYear();
      const endMonth = String(endDate.getUTCMonth() + 1).padStart(2, '0');
      const endDay = String(endDate.getUTCDate()).padStart(2, '0');
      
      const eventData = {
        name: values.name,
        start_date: `${startYear}-${startMonth}-${startDay}`,
        end_date: `${endYear}-${endMonth}-${endDay}`,
        location: values.location,
        address: values.address,
        description: values.description || null,
      };

      let response;

      if (id) {
        // Update existing event
        response = await supabase
          .from("events")
          .update(eventData)
          .eq("id", id);
      } else {
        // Create new event
        response = await supabase
          .from("events")
          .insert([eventData]);
      }

      const { error } = response;
      if (error) throw error;

      toast({
        title: id ? "Event updated" : "Event created",
        description: id
          ? "Event has been successfully updated"
          : "New event has been successfully created",
      });

      navigate("/events");
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: `Could not ${id ? "update" : "create"} event`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={id ? "Edit Event" : "Create Event"}>
      {id && (
        <div className="mb-4 flex justify-end space-x-2">
          <Button asChild variant="outline">
            <Link to={`/events/${id}/documents`}>
              <FileText className="mr-2 h-4 w-4" />
              View Documents
            </Link>
          </Button>
        </div>
      )}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Event Details</TabsTrigger>
          {id && <TabsTrigger value="documents">Documents</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Annual Conference 2025" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  disabled={isLoading}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  disabled={isLoading}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco, CA" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, San Francisco, CA" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter event description..."
                            {...field}
                            rows={4}
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
                      onClick={() => navigate("/events")}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Saving..." : id ? "Update Event" : "Create Event"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {id && (
          <TabsContent value="documents">
            <Card>
              <CardContent className="pt-6">
                <EventDocumentManager eventId={id} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
};

export default EventForm;
