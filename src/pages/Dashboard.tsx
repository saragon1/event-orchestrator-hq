
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Users, Plane, Bus } from "lucide-react";

const Dashboard = () => {
  // These would come from API calls eventually
  const stats = [
    { label: "Total Persons", value: 124, icon: Users, color: "text-blue-500" },
    { label: "Hotel Bookings", value: 87, icon: Hotel, color: "text-purple-500" },
    { label: "Flight Tickets", value: 92, icon: Plane, color: "text-indigo-500" },
    { label: "Bus Reservations", value: 53, icon: Bus, color: "text-green-500" },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    +{Math.floor(Math.random() * 20)}% from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 animate-fade-in" style={{animationDelay: "400ms"}}>
            <CardHeader>
              <CardTitle>Event Overview</CardTitle>
              <CardDescription>
                Current active events and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                Event charts and status will appear here
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{animationDelay: "500ms"}}>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm">
                      {["Hotel booking updated", "New person added", "Flight ticket assigned", "Bus travel scheduled"][i]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
