import { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useEventStore } from "@/stores/event-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, X, Trash } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { HexColorPicker } from "react-colorful";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type EventSchedule = Tables<'event_schedules'>;

interface Person {
  id: string;
  name: string;
  email: string;
}

interface EventScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<EventSchedule>) => void;
  onDelete?: (id: string) => void;
  schedule: EventSchedule | null;
}

export function EventScheduleModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  schedule
}: EventScheduleModalProps) {
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [availableSpeakers, setAvailableSpeakers] = useState<Person[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Person[]>([]);
  const [isLoadingSpeakers, setIsLoadingSpeakers] = useState(false);
  
  // Create form schema with Zod
  const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    location: z.string().optional(),
    schedule_type: z.string().min(1, "Type is required"),
    status: z.string().min(1, "Status is required"),
    capacity: z.number().optional().nullable(),
    color: z.string().optional().nullable(),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  }).refine((data) => {
    const startDateTime = combineDateTime(data.startDate, data.startTime);
    const endDateTime = combineDateTime(data.endDate, data.endTime);
    return isAfter(endDateTime!, startDateTime!);
  }, {
    message: "End time must be after start time",
    path: ["endTime"],
  }).refine((data) => {
    if (!event) return true;
    return !isBefore(data.startDate, new Date(event.start_date));
  }, {
    message: "Start date must be within event dates",
    path: ["startDate"],
  }).refine((data) => {
    if (!event) return true;
    return !isAfter(data.endDate, new Date(event.end_date));
  }, {
    message: "End date must be within event dates",
    path: ["endDate"],
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: schedule?.title || "",
      description: schedule?.description || "",
      location: schedule?.location || "",
      schedule_type: schedule?.schedule_type || "presentation",
      status: schedule?.status || "scheduled",
      capacity: schedule?.capacity || null,
      color: schedule?.color || "",
      startDate: schedule?.start_time ? new Date(schedule.start_time) : undefined,
      endDate: schedule?.end_time ? new Date(schedule.end_time) : undefined,
      startTime: schedule?.start_time ? format(new Date(schedule.start_time), "HH:mm") : "",
      endTime: schedule?.end_time ? format(new Date(schedule.end_time), "HH:mm") : "",
    },
  });

  // Load event details to validate date ranges
  useEffect(() => {
    if (!selectedEventId) return;
    
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', selectedEventId)
          .single();
          
        if (error) throw error;
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event details:', error);
      }
    };
    
    fetchEvent();
  }, [selectedEventId]);
  
  // Load available speakers (speakers and vips from the event)
  useEffect(() => {
    if (!selectedEventId) return;
    
    const fetchSpeakers = async () => {
      setIsLoadingSpeakers(true);
      try {
        const { data, error } = await supabase
          .from('event_persons')
          .select(`
            persons:person_id(id, name, email),
            event_role
          `)
          .eq('event_id', selectedEventId)
          .in('event_role', ['speaker', 'vip']);
          
        if (error) throw error;
        
        const speakers = data
          .map(item => item.persons as Person)
          .filter(Boolean);
          
        setAvailableSpeakers(speakers);
        
        // Set initial selected speakers if editing
        if (schedule?.speaker_ids && schedule.speaker_ids.length > 0) {
          const initialSpeakers = speakers.filter(speaker => 
            schedule.speaker_ids.includes(speaker.id)
          );
          setSelectedSpeakers(initialSpeakers);
        } else {
          setSelectedSpeakers([]);
        }
      } catch (error) {
        console.error('Error fetching available speakers:', error);
      } finally {
        setIsLoadingSpeakers(false);
      }
    };
    
    fetchSpeakers();
  }, [selectedEventId, schedule]);
  
  // Reset form values when schedule changes
  useEffect(() => {
    if (schedule) {
      form.reset({
        title: schedule.title || "",
        description: schedule.description || "",
        location: schedule.location || "",
        schedule_type: schedule.schedule_type || "presentation",
        status: schedule.status || "scheduled",
        capacity: schedule.capacity || null,
        color: schedule.color || "",
        startDate: schedule.start_time ? new Date(schedule.start_time) : undefined,
        endDate: schedule.end_time ? new Date(schedule.end_time) : undefined,
        startTime: schedule.start_time ? format(new Date(schedule.start_time), "HH:mm") : "",
        endTime: schedule.end_time ? format(new Date(schedule.end_time), "HH:mm") : "",
      });
    }
  }, [schedule, form]);
  
  // Helper to combine date and time
  const combineDateTime = (date: Date | undefined, timeStr: string): Date | null => {
    if (!date || !timeStr) {
      return null;
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Combine date and time
    const startDateTime = combineDateTime(values.startDate, values.startTime);
    const endDateTime = combineDateTime(values.endDate, values.endTime);
    
    if (!startDateTime || !endDateTime) {
      return; // Invalid datetime
    }
    
    const speakerIds = selectedSpeakers.map(speaker => speaker.id);
    
    const scheduleData: Partial<EventSchedule> = {
      title: values.title,
      description: values.description,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      location: values.location,
      schedule_type: values.schedule_type,
      status: values.status,
      capacity: values.capacity,
      color: values.color,
      speaker_ids: speakerIds
    };
    
    onSave(scheduleData);
  };
  
  // Handle speaker selection
  const toggleSpeaker = (speaker: Person) => {
    setSelectedSpeakers(prev => {
      const isSelected = prev.some(p => p.id === speaker.id);
      
      if (isSelected) {
        return prev.filter(p => p.id !== speaker.id);
      } else {
        return [...prev, speaker];
      }
    });
  };
  
  // Remove a selected speaker
  const removeSpeaker = (speakerId: string) => {
    setSelectedSpeakers(prev => prev.filter(p => p.id !== speakerId));
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {schedule?.id ? "Edit Schedule Item" : "Create Schedule Item"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter description" 
                      className="resize-none min-h-[100px]" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal w-full",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Select date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => 
                            event ? isBefore(date, new Date(event.start_date)) || 
                                    isAfter(date, new Date(event.end_date)) : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal w-full",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Select date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => 
                            event ? isBefore(date, new Date(event.start_date)) || 
                                   isAfter(date, new Date(event.end_date)) : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="schedule_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="panel">Panel</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="registration">Registration</SelectItem>
                        <SelectItem value="keynote">Keynote</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                        <SelectItem value="postponed">Postponed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter location" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter capacity"
                        {...field}
                        value={field.value?.toString() || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex items-center gap-2">
                    <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            type="button"
                          >
                            {field.value ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-4 w-4 rounded-full border"
                                  style={{ backgroundColor: field.value }}
                                />
                                <span>{field.value}</span>
                              </div>
                            ) : (
                              "Select color"
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4">
                        <HexColorPicker color={field.value || ""} onChange={field.onChange} />
                      </PopoverContent>
                    </Popover>
                    
                    {field.value && (
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => field.onChange("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <Label>Speakers</Label>
              <div className="flex flex-wrap gap-2 py-2">
                {selectedSpeakers.map(speaker => (
                  <Badge key={speaker.id} variant="secondary">
                    {speaker.name}
                    <button
                      type="button"
                      className="ml-1 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => removeSpeaker(speaker.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedSpeakers.length === 0 && (
                  <span className="text-sm text-muted-foreground">No speakers selected</span>
                )}
              </div>
              
              <ScrollArea className="h-[150px] w-full border rounded-md p-2">
                {isLoadingSpeakers ? (
                  <div className="text-sm text-muted-foreground">Loading speakers...</div>
                ) : availableSpeakers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No speakers found for this event</div>
                ) : (
                  <div className="space-y-2">
                    {availableSpeakers.map(speaker => (
                      <div
                        key={speaker.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md cursor-pointer",
                          selectedSpeakers.some(s => s.id === speaker.id)
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                        onClick={() => toggleSpeaker(speaker)}
                      >
                        <div>
                          <p className="font-medium">{speaker.name}</p>
                          <p className="text-xs text-muted-foreground">{speaker.email}</p>
                        </div>
                        {selectedSpeakers.some(s => s.id === speaker.id) && (
                          <Badge variant="default" className="ml-auto">Selected</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            
            <DialogFooter className="flex items-center justify-between pt-2">
              <div>
                {schedule?.id && onDelete && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => {
                      onDelete(schedule.id);
                      onClose();
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {schedule?.id ? "Update" : "Create"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 