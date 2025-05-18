import { DashboardLayout } from "@/components/dashboard/layout";
import { useEventStore } from "@/stores/event-store";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { EventDocumentManager } from "@/components/EventDocuments/EventDocumentManager";
import { useEffect } from "react";

const EventDocuments = () => {
  const { selectedEventId } = useEventStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedEventId) {
      toast({
        title: "No event selected",
        description: "Please select an event first",
        variant: "destructive",
      });
      navigate("/events");
    }
  }, [selectedEventId, toast, navigate]);

  if (!selectedEventId) return null;

  return (
    <DashboardLayout title="Event Documents">
      <EventDocumentManager eventId={selectedEventId} />
    </DashboardLayout>
  );
};

export default EventDocuments; 