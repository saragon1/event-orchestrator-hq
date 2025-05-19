import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { useEventStore } from "@/stores/event-store";
import { useEventManagement } from "@/hooks/use-event-management";
import { ResourceManagementModal } from "@/components/resource-management/resource-management-modal";
import { DashboardStats } from "@/components/dashboard/stats/dashboard-stats";
import { EventHeader } from "@/components/dashboard/event-header";
import { ResourceManagementSection } from "@/components/dashboard/resource-management-section";
import { ParticipantsTable } from "@/components/dashboard/participants-table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Mail, Check, X, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Add a type declaration for the extended window
interface ExtendedWindow extends Window {
  refreshParticipantsTable?: () => void;
}

// Define interface for participants with status
interface ParticipantStatus {
  waiting_invite: number;
  invited: number;
  confirmed: number;
  declined: number;
}

// Interface for person with role
interface ParticipantWithRole {
  id: string;
  name: string;
  event_role: string;
}

const Dashboard = () => {
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [statusCounts, setStatusCounts] = useState<ParticipantStatus>({
    waiting_invite: 0,
    invited: 0,
    confirmed: 0,
    declined: 0
  });
  const [participantsByStatus, setParticipantsByStatus] = useState<Record<string, ParticipantWithRole[]>>({
    waiting_invite: [],
    invited: [],
    confirmed: [],
    declined: []
  });
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const { toast } = useToast();
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
  
  // Function to refresh status counts
  const refreshStatusCounts = async () => {
    if (!selectedEventId) return;
    
    try {
      const { data, error } = await supabase
        .from('event_persons')
        .select('invite_status, persons:person_id(id, name), event_role')
        .eq('event_id', selectedEventId);
        
      if (error) throw error;
      
      // Count statuses
      const counts = {
        waiting_invite: 0,
        invited: 0,
        confirmed: 0,
        declined: 0
      };
      
      // Group participants by status
      const byStatus: Record<string, ParticipantWithRole[]> = {
        waiting_invite: [],
        invited: [],
        confirmed: [],
        declined: []
      };
      
      data.forEach(item => {
        const status = item.invite_status || "waiting_invite";
        counts[status as keyof ParticipantStatus]++;
        
        if (item.persons) {
          byStatus[status].push({
            id: item.persons.id,
            name: item.persons.name,
            event_role: item.event_role || "attendee"
          });
        }
      });
      
      setStatusCounts(counts);
      setParticipantsByStatus(byStatus);
    } catch (error) {
      console.error('Error fetching participant status counts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch participant status counts",
        variant: "destructive",
      });
    }
  };
  
  // Function to open dialog with participants of a specific status
  const showParticipantsByStatus = (status: string) => {
    setCurrentStatus(status);
    setIsStatusDialogOpen(true);
  };
  
  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };
  
  // Format role for display
  const formatRole = (role: string) => {
    return role.replace(/\b\w/g, c => c.toUpperCase());
  };
  
  // Get badge variant for role
  const getRoleBadgeVariant = (role: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (role) {
      case 'vip':
        return 'default';
      case 'speaker':
        return 'secondary';
      case 'staff':
        return 'destructive';
      case 'attendee':
      case 'other':
      default:
        return 'outline';
    }
  };
  
  // Fetch participant status counts
  useEffect(() => {
    if (!selectedEventId) {
      setStatusCounts({
        waiting_invite: 0,
        invited: 0,
        confirmed: 0,
        declined: 0
      });
      return;
    }
    
    refreshStatusCounts();
  }, [selectedEventId, toast]);

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
              refreshStatusCounts();
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
              refreshStatusCounts();
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
        <h2 className="text-2xl font-semibold mb-4">Participant Status</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col p-4 bg-white shadow-sm rounded-lg border">
            <div className="flex items-center text-muted-foreground mb-1">
              <Clock className="h-4 w-4 mr-2" />
              <span>Waiting Invite</span>
            </div>
            <button 
              onClick={() => showParticipantsByStatus("waiting_invite")}
              className="text-3xl font-bold hover:text-primary transition-colors text-left"
            >
              {statusCounts.waiting_invite}
            </button>
          </div>
          
          <div className="flex flex-col p-4 bg-white shadow-sm rounded-lg border">
            <div className="flex items-center text-muted-foreground mb-1">
              <Mail className="h-4 w-4 mr-2" />
              <span>Invited</span>
            </div>
            <button 
              onClick={() => showParticipantsByStatus("invited")}
              className="text-3xl font-bold hover:text-primary transition-colors text-left"
            >
              {statusCounts.invited}
            </button>
          </div>
          
          <div className="flex flex-col p-4 bg-white shadow-sm rounded-lg border">
            <div className="flex items-center text-muted-foreground mb-1">
              <Check className="h-4 w-4 mr-2" />
              <span>Confirmed</span>
            </div>
            <button 
              onClick={() => showParticipantsByStatus("confirmed")}
              className="text-3xl font-bold hover:text-primary transition-colors text-left"
            >
              {statusCounts.confirmed}
            </button>
          </div>
          
          <div className="flex flex-col p-4 bg-white shadow-sm rounded-lg border">
            <div className="flex items-center text-muted-foreground mb-1">
              <X className="h-4 w-4 mr-2" />
              <span>Declined</span>
            </div>
            <button 
              onClick={() => showParticipantsByStatus("declined")}
              className="text-3xl font-bold hover:text-primary transition-colors text-left"
            >
              {statusCounts.declined}
            </button>
          </div>
        </div>
      </div>

      {/* Participants List Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formatStatus(currentStatus)} Participants</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {participantsByStatus[currentStatus]?.length > 0 ? (
              participantsByStatus[currentStatus].map(participant => (
                <div key={participant.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{participant.name}</span>
                  </div>
                  <Badge variant={getRoleBadgeVariant(participant.event_role)}>
                    {formatRole(participant.event_role)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">No participants found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-8">
        <Accordion type="single" collapsible defaultValue="participants">
          <AccordionItem value="participants">
            <AccordionTrigger className="flex items-center">
              <div className="flex items-center">
                <h2 className="text-2xl font-semibold">Event Participants</h2>
                <p className="ml-4 text-muted-foreground">
                  {selectedEvent ? `${assignedPersons.length} participants` : "Select an event to view participants"}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ParticipantsTable selectedEventId={selectedEventId} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

    </DashboardLayout>
  );
};

export default Dashboard;
