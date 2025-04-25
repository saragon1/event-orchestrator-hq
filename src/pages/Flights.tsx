
import { DashboardLayout } from "@/components/dashboard/layout";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

const Flights = () => {
  const handleAddFlight = () => {
    console.log("Add flight clicked");
  };

  return (
    <DashboardLayout title="Flights">
      <EmptyPlaceholder
        title="No flights added yet"
        description="Add flights to start managing participant travel."
        icon={<Plane className="h-8 w-8 text-muted-foreground" />}
        action={{
          label: "Add Flight",
          onClick: handleAddFlight,
        }}
      />
    </DashboardLayout>
  );
};

export default Flights;
