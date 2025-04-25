
import { DashboardLayout } from "@/components/dashboard/layout";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { Button } from "@/components/ui/button";
import { Hotel } from "lucide-react";

const Hotels = () => {
  const handleAddHotel = () => {
    console.log("Add hotel clicked");
  };

  return (
    <DashboardLayout title="Hotels">
      <EmptyPlaceholder
        title="No hotels added yet"
        description="Add hotels to start managing participant accommodations."
        icon={<Hotel className="h-8 w-8 text-muted-foreground" />}
        action={{
          label: "Add Hotel",
          onClick: handleAddHotel,
        }}
      />
    </DashboardLayout>
  );
};

export default Hotels;
