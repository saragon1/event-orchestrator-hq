
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

// Define the schema with proper transformation for the rating field
const formSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  rating: z.string()
    .optional()
    .transform((val) => {
      // Transform empty string to null
      if (!val) return null;
      // Parse the value to a number
      const parsed = parseInt(val, 10);
      // Return null if parsing fails
      return isNaN(parsed) ? null : parsed;
    })
    .refine(
      (val) => val === null || (val >= 1 && val <= 5),
      "Rating must be between 1 and 5"
    ),
});

// Create a type that represents the form values before transformation
type FormInputValues = {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  website: string;
  rating: string;
};

// Create a type that represents the form values after transformation
type FormValues = z.infer<typeof formSchema>;

const HotelForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      website: "",
      rating: "",
    },
  });

  useEffect(() => {
    const fetchHotel = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("hotels")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            name: data.name,
            address: data.address,
            city: data.city,
            country: data.country,
            phone: data.phone || "",
            website: data.website || "",
            rating: data.rating?.toString() || "",
          });
        }
      } catch (error) {
        console.error("Error fetching hotel:", error);
        toast({
          title: "Error",
          description: "Could not fetch hotel details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotel();
  }, [id, form, toast]);

  const onSubmit = async (values: FormInputValues) => {
    setIsLoading(true);

    try {
      // The schema will transform the rating string to number or null
      const transformedValues = formSchema.parse(values);
      
      const hotelData = {
        name: transformedValues.name,
        address: transformedValues.address,
        city: transformedValues.city,
        country: transformedValues.country,
        phone: transformedValues.phone || null,
        website: transformedValues.website || null,
        rating: transformedValues.rating, // Will be number or null after transformation
      };

      let response;

      if (id) {
        response = await supabase
          .from("hotels")
          .update(hotelData)
          .eq("id", id);
      } else {
        response = await supabase
          .from("hotels")
          .insert([hotelData]);
      }

      const { error } = response;
      if (error) throw error;

      toast({
        title: id ? "Hotel updated" : "Hotel created",
        description: id
          ? "Hotel has been successfully updated"
          : "New hotel has been successfully created",
      });

      navigate("/hotels");
    } catch (error) {
      console.error("Error saving hotel:", error);
      toast({
        title: "Error",
        description: `Could not ${id ? "update" : "create"} hotel`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={id ? "Edit Hotel" : "Create Hotel"}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Grand Hotel" {...field} disabled={isLoading} />
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
                      <Input placeholder="123 Main St" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="USA" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 8900" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (Optional, 1-5)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5"
                        placeholder="5"
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
                  onClick={() => navigate("/hotels")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : id ? "Update Hotel" : "Create Hotel"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default HotelForm;
