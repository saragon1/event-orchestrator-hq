import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from "@/components/dashboard/layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEventStore } from "@/stores/event-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, List, Trash2, Edit, UserCircle } from "lucide-react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import { EventScheduleModal } from "@/components/schedules/event-schedule-modal";
import { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type EventSchedule = Tables<'event_schedules'>;
type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    description: string | null;
    location: string | null;
    type: string;
    speakers: Array<{name: string; email: string}>;
    speakerIds: string[];
  }
};

// Generate a random pastel color
const generatePastelColor = (): string => {
  // Generate higher base values for pastel effect (between 150-240)
  const r = 150 + Math.floor(Math.random() * 90);
  const g = 150 + Math.floor(Math.random() * 90);
  const b = 150 + Math.floor(Math.random() * 90);
  
  // Convert to hex format
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export default function EventSchedulePage() {
  const { toast } = useToast();
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<EventSchedule | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [speakers, setSpeakers] = useState<Record<string, { name: string; email: string }>>({});
  
  // Fetch event details and schedules
  useEffect(() => {
    if (!selectedEventId) {
      setIsLoading(false);
      return;
    }
    
    const fetchEventAndSchedules = async () => {
      setIsLoading(true);
      try {
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', selectedEventId)
          .single();
          
        if (eventError) throw eventError;
        setEvent(eventData);
        
        // Fetch all persons who might be speakers
        const { data: personsData, error: personsError } = await supabase
          .from('persons')
          .select('id, name, email');
          
        if (personsError) throw personsError;
        
        // Create a map of person id to person data
        const speakersMap: Record<string, { name: string; email: string }> = {};
        personsData?.forEach(person => {
          speakersMap[person.id] = { name: person.name, email: person.email };
        });
        
        setSpeakers(speakersMap);
        
        // Fetch event schedules
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('event_schedules')
          .select('*')
          .eq('event_id', selectedEventId)
          .order('start_time');
          
        if (schedulesError) throw schedulesError;
        setSchedules(schedulesData || []);
        
        // Transform schedules into calendar events
        const transformedEvents = schedulesData?.map(schedule => {
          // Get speaker objects from ids
          const speakerObjects = (schedule.speaker_ids || [])
            .map(id => speakersMap[id])
            .filter(Boolean);
            
          return {
            id: schedule.id,
            title: schedule.title,
            start: schedule.start_time,
            end: schedule.end_time,
            backgroundColor: schedule.color || getColorForType(schedule.schedule_type),
            borderColor: schedule.color || getColorForType(schedule.schedule_type),
            textColor: '#ffffff',
            extendedProps: {
              description: schedule.description,
              location: schedule.location,
              type: schedule.schedule_type,
              speakers: speakerObjects,
              speakerIds: schedule.speaker_ids || []
            }
          };
        }) || [];
        
        setCalendarEvents(transformedEvents);
      } catch (error) {
        console.error('Error fetching event details or schedules:', error);
        toast({
          title: 'Error',
          description: 'Failed to load event schedules',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventAndSchedules();
  }, [selectedEventId, toast]);
  
  // Helper function to get color based on schedule type
  const getColorForType = (type: string): string => {
    const colors = {
      'presentation': '#3788d8',
      'workshop': '#8e44ad',
      'panel': '#2ecc71',
      'break': '#95a5a6',
      'social': '#e67e22',
      'registration': '#f39c12',
      'keynote': '#e74c3c',
      'other': '#34495e'
    };
    
    return colors[type as keyof typeof colors] || '#3788d8';
  };
  
  // Handle creating a new schedule
  const handleCreateSchedule = () => {
    // Generate a random pastel color for new schedule
    const randomColor = generatePastelColor();
    
    setSelectedSchedule({
      id: '',
      event_id: selectedEventId || '',
      title: '',
      description: '',
      color: randomColor,
      start_time: '',
      end_time: '',
      location: '',
      speaker_ids: [],
      schedule_type: 'presentation',
      status: 'scheduled'
    } as EventSchedule);
    
    setIsModalOpen(true);
  };
  
  // Handle schedule editing
  const handleEditSchedule = (schedule: EventSchedule) => {
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };
  
  // Handle schedule deletion
  const handleDeleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('event_schedules')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Remove from state
      setSchedules(schedules.filter(schedule => schedule.id !== id));
      setCalendarEvents(calendarEvents.filter(event => event.id !== id));
      
      toast({
        title: 'Schedule deleted',
        description: 'The schedule item has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule item',
        variant: 'destructive',
      });
    }
  };
  
  // Handle drag-and-drop event updates
  const handleEventDrop = async (info: EventDropArg) => {
    const { event } = info;
    
    try {
      const { error } = await supabase
        .from('event_schedules')
        .update({
          start_time: event.start?.toISOString() || '',
          end_time: event.end?.toISOString() || ''
        })
        .eq('id', event.id);
        
      if (error) throw error;
      
      // Update local state
      setSchedules(schedules.map(schedule => 
        schedule.id === event.id 
          ? { 
              ...schedule, 
              start_time: event.start?.toISOString() || schedule.start_time, 
              end_time: event.end?.toISOString() || schedule.end_time
            } 
          : schedule
      ));
      
      toast({
        title: 'Schedule updated',
        description: 'The schedule has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive',
      });
      info.revert();
    }
  };
  
  // Handle event resize
  const handleEventResize = async (info: EventResizeDoneArg) => {
    const { event } = info;
    
    try {
      const { error } = await supabase
        .from('event_schedules')
        .update({
          end_time: event.end?.toISOString() || ''
        })
        .eq('id', event.id);
        
      if (error) throw error;
      
      // Update local state
      setSchedules(schedules.map(schedule => 
        schedule.id === event.id 
          ? { ...schedule, end_time: event.end?.toISOString() || schedule.end_time } 
          : schedule
      ));
      
      toast({
        title: 'Schedule updated',
        description: 'The schedule duration has been updated',
      });
    } catch (error) {
      console.error('Error resizing schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule duration',
        variant: 'destructive',
      });
      info.revert();
    }
  };
  
  // Handle direct calendar date selection for new events
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!selectedEventId) return;
    
    const scheduleData: Partial<EventSchedule> = {
      id: '',
      event_id: selectedEventId,
      title: '',
      description: '',
      start_time: selectInfo.startStr,
      end_time: selectInfo.endStr,
      location: '',
      speaker_ids: [],
      schedule_type: 'presentation',
      status: 'scheduled'
    };
    
    setSelectedSchedule(scheduleData as EventSchedule);
    setIsModalOpen(true);
  };
  
  // Function to save a schedule (create or update)
  const handleSaveSchedule = async (scheduleData: Partial<EventSchedule>) => {
    try {
      let result;
      
      if (selectedSchedule?.id) {
        // Update existing schedule
        result = await supabase
          .from('event_schedules')
          .update({
            ...scheduleData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedSchedule.id)
          .select()
          .single();
          
        if (result.error) throw result.error;
        
        // Update local state
        setSchedules(schedules.map(s => s.id === result.data.id ? result.data : s));
        
        // Get speaker objects for the updated schedule
        const updatedSpeakerObjects = (result.data.speaker_ids || [])
          .map(id => speakers[id])
          .filter(Boolean);
          
        setCalendarEvents(calendarEvents.map(e => 
          e.id === result.data.id 
            ? {
                ...e,
                title: result.data.title,
                start: result.data.start_time,
                end: result.data.end_time,
                backgroundColor: result.data.color || getColorForType(result.data.schedule_type),
                borderColor: result.data.color || getColorForType(result.data.schedule_type),
                extendedProps: {
                  description: result.data.description,
                  location: result.data.location,
                  type: result.data.schedule_type,
                  speakers: updatedSpeakerObjects,
                  speakerIds: result.data.speaker_ids || []
                }
              }
            : e
        ));
        
        toast({
          title: 'Schedule updated',
          description: 'The schedule has been updated successfully',
        });
      } else {
        // Create new schedule
        const newSchedule = {
          title: scheduleData.title || '',
          description: scheduleData.description,
          start_time: scheduleData.start_time || '',
          end_time: scheduleData.end_time || '',
          location: scheduleData.location,
          schedule_type: scheduleData.schedule_type || 'presentation',
          status: scheduleData.status || 'scheduled',
          capacity: scheduleData.capacity,
          color: scheduleData.color,
          speaker_ids: scheduleData.speaker_ids,
          event_id: selectedEventId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        result = await supabase
          .from('event_schedules')
          .insert(newSchedule)
          .select()
          .single();
          
        if (result.error) throw result.error;
        
        // Get speaker objects for the new schedule
        const newSpeakerObjects = (result.data.speaker_ids || [])
          .map(id => speakers[id])
          .filter(Boolean);
          
        // Update local state
        setSchedules([...schedules, result.data]);
        setCalendarEvents([
          ...calendarEvents, 
          {
            id: result.data.id,
            title: result.data.title,
            start: result.data.start_time,
            end: result.data.end_time,
            backgroundColor: result.data.color || getColorForType(result.data.schedule_type),
            borderColor: result.data.color || getColorForType(result.data.schedule_type),
            textColor: '#ffffff',
            extendedProps: {
              description: result.data.description,
              location: result.data.location,
              type: result.data.schedule_type,
              speakers: newSpeakerObjects,
              speakerIds: result.data.speaker_ids || []
            }
          }
        ]);
        
        toast({
          title: 'Schedule created',
          description: 'The new schedule item has been created',
        });
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save schedule',
        variant: 'destructive',
      });
    }
  };
  
  // Handle clicking on a calendar event
  const handleEventClick = (info: EventClickArg) => {
    const scheduleId = info.event.id;
    const schedule = schedules.find(s => s.id === scheduleId);
    
    if (schedule) {
      setSelectedSchedule(schedule);
      setIsModalOpen(true);
    }
  };
  
  // Format time for display in list view
  const formatTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Format speaker names for display
  const formatSpeakers = (speakerIds: string[] = []) => {
    if (!speakerIds.length) return '—';
    
    return speakerIds
      .map(id => speakers[id]?.name || 'Unknown')
      .join(', ');
  };
  
  // Render event content
  const renderEventContent = (eventInfo: {
    event: {
      title: string;
      extendedProps: {
        speakerIds?: string[];
        speakers?: Array<{
          id: string;
          name: string;
        }>;
        location?: string | null;
      }
    }
  }) => {
    const { speakers = [] } = eventInfo.event.extendedProps;
    
    return (
      <div className="w-full overflow-hidden">
        <div className="font-semibold text-sm truncate">{eventInfo.event.title}</div>
        <div className="flex items-center text-xs">
          {speakers.length > 0 && (
            <div className="flex items-center mr-1">
              <UserCircle className="h-3 w-3 mr-0.5" />
              <span className="truncate">
                {speakers[0]?.name}
                {speakers.length > 1 && ` +${speakers.length - 1}`}
              </span>
            </div>
          )}
          {eventInfo.event.extendedProps.location && (
            <div className="truncate ml-1">
              <span>📍 {eventInfo.event.extendedProps.location}</span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  if (!selectedEventId) {
    return (
      <DashboardLayout title="Event Schedule">
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">Please select an event to view its schedule</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Event Schedule">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{event?.name || 'Event'} Schedule</h1>
          <p className="text-muted-foreground">
            {event ? `${format(new Date(event.start_date), 'PPP')} to ${format(new Date(event.end_date), 'PPP')}` : ''}
          </p>
        </div>
        <Button onClick={handleCreateSchedule}>
          <Plus className="mr-2 h-4 w-4" /> Add Schedule Item
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      ) : (
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" /> Calendar View
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" /> List View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="w-full">
            <Card>
              <CardContent className="pt-6">
                <div className="h-[600px]">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    initialDate={event?.start_date || new Date()}
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventResize}
                    select={handleDateSelect}
                    validRange={{
                      start: event?.start_date || '',
                      end: event?.end_date || ''
                    }}
                    height="100%"
                    eventContent={renderEventContent}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Schedule List</CardTitle>
                <CardDescription>All scheduled items for this event</CardDescription>
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-muted-foreground">No schedule items found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Speakers</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map(schedule => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.title}</TableCell>
                          <TableCell className="capitalize">{schedule.schedule_type}</TableCell>
                          <TableCell>{formatTime(schedule.start_time)}</TableCell>
                          <TableCell>{formatTime(schedule.end_time)}</TableCell>
                          <TableCell>{schedule.location || '—'}</TableCell>
                          <TableCell>
                            {schedule.speaker_ids && schedule.speaker_ids.length > 0 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="cursor-default">
                                      {schedule.speaker_ids.map(id => speakers[id]?.name || 'Unknown').join(', ') || 'Unknown speakers'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{formatSpeakers(schedule.speaker_ids)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="capitalize">{schedule.status}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditSchedule(schedule)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {isModalOpen && (
        <EventScheduleModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSchedule(null);
          }}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
          schedule={selectedSchedule}
        />
      )}
    </DashboardLayout>
  );
} 