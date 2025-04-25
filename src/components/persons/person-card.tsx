
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hotel, Plane, Bus } from "lucide-react";

interface PersonCardProps {
  id: string;
  name: string;
  email: string;
  role?: string;
  hasHotel?: boolean;
  hasFlight?: boolean;
  hasBus?: boolean;
  onViewDetails?: () => void;
}

export const PersonCard = ({
  id,
  name,
  email,
  role,
  hasHotel = false,
  hasFlight = false,
  hasBus = false,
  onViewDetails,
}: PersonCardProps) => {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="font-medium">{name}</CardTitle>
        <CardDescription>{email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {role && <Badge variant="outline">{role}</Badge>}
          <div className="flex items-center gap-1 ml-auto">
            {hasHotel && (
              <Badge variant="secondary" className="flex gap-1">
                <Hotel className="h-3 w-3" />
              </Badge>
            )}
            {hasFlight && (
              <Badge variant="secondary" className="flex gap-1">
                <Plane className="h-3 w-3" />
              </Badge>
            )}
            {hasBus && (
              <Badge variant="secondary" className="flex gap-1">
                <Bus className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={onViewDetails}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
