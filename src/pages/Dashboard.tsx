import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { useEventStore } from "@/stores/event-store";
import { useEventManagement } from "@/hooks/use-event-management";
import { ResourceManagementModal } from "@/components/resource-management/resource-management-modal";
import { DashboardStats } from "@/components/dashboard/stats/dashboard-stats";
import { EventHeader } from "@/components/dashboard/event-header";
import { ResourceManagementSection } from "@/components/dashboard/resource-management-section";
import { ParticipantsTable } from "@/components/dashboard/participants-table";

// Add a type declaration for the extended window
interface ExtendedWindow extends Window {
  refreshParticipantsTable?: () => void;
}

const Dashboard = () => {
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const selectedEvent = useEventStore((state) => 
    state.events.find(event => event.id === selectedEventId)
  );

  const {
    availablePersons,
    assignedPersons,
    availableHotels,
    assignedHotels,
    isLoading,
    fetchAvailablePersons,
    fetchAssignedPersons,
    assignPersonToEvent,
    removePersonFromEvent,
    fetchAvailableHotels,
    fetchAssignedHotels,
    assignHotelToEvent,
    removeHotelFromEvent,
  } = useEventManagement(selectedEventId || '');

  // Refresh data when modal opens
  useEffect(() => {
    if (isPersonModalOpen) {
      fetchAvailablePersons();
      fetchAssignedPersons();
    }
  }, [isPersonModalOpen]);

  useEffect(() => {
    if (isHotelModalOpen) {
      fetchAvailableHotels();
      fetchAssignedHotels();
    }
  }, [isHotelModalOpen]);

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <EventHeader event={selectedEvent} />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-6">
          <ResourceManagementSection
            title="Persons"
            description={selectedEvent 
              ? `${assignedPersons.length} persons assigned to this event` 
              : "Select an event to manage persons"}
            onManageClick={() => setIsPersonModalOpen(true)}
            disabled={!selectedEvent}
          />

          <ResourceManagementSection
            title="Hotels"
            description={selectedEvent 
              ? `${assignedHotels.length} hotels assigned to this event` 
              : "Select an event to manage hotels"}
            onManageClick={() => setIsHotelModalOpen(true)}
            disabled={!selectedEvent}
          />
        </div>

        <ResourceManagementModal
          title={`Manage Persons for ${selectedEvent?.name || ''}`}
          isOpen={isPersonModalOpen}
          onClose={() => setIsPersonModalOpen(false)}
          availableResources={availablePersons}
          assignedResources={assignedPersons}
          onAssign={(personId) => {
            assignPersonToEvent(personId);
            // Refresh participants table after assignment
            setTimeout(() => {
              const extendedWindow = window as ExtendedWindow;
              if (extendedWindow.refreshParticipantsTable) {
                extendedWindow.refreshParticipantsTable();
              }
            }, 500); // Small delay to ensure the database operation completes
          }}
          onRemove={(personId) => {
            removePersonFromEvent(personId);
            // Refresh participants table after removal
            setTimeout(() => {
              const extendedWindow = window as ExtendedWindow;
              if (extendedWindow.refreshParticipantsTable) {
                extendedWindow.refreshParticipantsTable();
              }
            }, 500); // Small delay to ensure the database operation completes
          }}
          resourceType="person"
          isLoading={isLoading.persons}
        />

        <ResourceManagementModal
          title={`Manage Hotels for ${selectedEvent?.name || ''}`}
          isOpen={isHotelModalOpen}
          onClose={() => setIsHotelModalOpen(false)}
          availableResources={availableHotels}
          assignedResources={assignedHotels}
          onAssign={assignHotelToEvent}
          onRemove={removeHotelFromEvent}
          resourceType="hotel"
          isLoading={isLoading.hotels}
        />
      </div>

      <div className="mt-6">
        <DashboardStats selectedEventId={selectedEventId} />
      </div>

      <div className="mt-8">
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-semibold">Event Participants</h2>
          <p className="ml-4 text-muted-foreground">
            {selectedEvent ? `${assignedPersons.length} participants` : "Select an event to view participants"}
          </p>
        </div>
        <ParticipantsTable selectedEventId={selectedEventId} />
      </div>

    </DashboardLayout>
  );
};

export default Dashboard;
