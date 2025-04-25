
import { DashboardLayout } from "@/components/dashboard/layout";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { Button } from "@/components/ui/button";
import { Bus } from "lucide-react";

const Buses = () => {
  const handleAddBus = () => {
    console.log("Add bus clicked");
  };

  return (
    <DashboardLayout title="Buses">
      <EmptyPlaceholder
        title="No buses added yet"
        description="Add buses to start managing ground transportation."
        icon={<Bus className="h-8 w-8 text-muted-foreground" />}
        action={{
          label: "Add Bus",
          onClick: handleAddBus,
        }}
      />
    </DashboardLayout>
  );
};

export default Buses;
