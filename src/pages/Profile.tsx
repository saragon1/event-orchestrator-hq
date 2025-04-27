import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, User } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
    },
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("persons")
          .select("name, email, phone")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            name: data.name,
            email: data.email,
            phone: data.phone || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast({
          title: t("common.error"),
          description: t("profile.couldNotUpdateProfile"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [user, form, toast, t]);

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);

    try {
      if (!user) throw new Error(t("profile.mustBeLoggedIn"));

      const profileData = {
        name: values.name,
        phone: values.phone || null,
      };

      const { error } = await supabase
        .from("persons")
        .update(profileData)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: t("profile.profileUpdated"),
        description: t("profile.profileUpdateSuccess"),
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: t("common.error"),
        description: t("profile.couldNotUpdateProfile"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout title={t("common.profile")}>
        <div className="flex items-center justify-center h-[60vh]">
          <p>{t("profile.mustBeLoggedIn")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("common.myProfile")}>
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("profile.profileSettings")}
            </CardTitle>
            <CardDescription>
              {t("profile.manageProfile")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.yourName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.email")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.yourEmail")} {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.phone")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.yourPhone")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {user.role && (
                  <div className="flex flex-col space-y-1.5 pb-4">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t("profile.role")}
                    </label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                      {user.role}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("common.saveChanges")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile; 