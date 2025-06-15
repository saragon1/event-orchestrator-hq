import { Calendar, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface Event {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
}

interface EventHeaderProps {
  event: Event | undefined;
}

export const EventHeader = ({ event }: EventHeaderProps) => {
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);

  const copyInviteLink = () => {
    if (!event) return;
    
    // Get the base URL of the application
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/event-registration/${event.id}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        setCopying(true);
        toast({
          title: "Link copiato!",
          description: "Il link di invito è stato copiato negli appunti",
        });
        
        // Reset copying state after 1.5 seconds
        setTimeout(() => setCopying(false), 1500);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Errore",
          description: "Impossibile copiare il link",
          variant: "destructive",
        });
      });
  };

  if (!event) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 p-4 rounded-lg">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          No Event Selected
        </h2>
        <p className="mt-1">
          Please select an event from the dropdown to view event-specific data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Current Event: {event.name}
        </h2>
        <p className="text-muted-foreground mt-1">
          {event.location} • {new Date(event.start_date).toLocaleDateString()} to{" "}
          {new Date(event.end_date).toLocaleDateString()}
        </p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2" 
        onClick={copyInviteLink}
        disabled={copying}
      >
        <Copy className="h-4 w-4" />
        {copying ? "Copiato!" : "Copia link invito"}
      </Button>
    </div>
  );
};
