
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
import { Eye, Pencil, Hotel, Plane, Bus } from "lucide-react";

interface PersonCardProps {
  id: string;
  name: string;
  email: string;
  role?: string;
  hasHotel?: boolean;
  hasFlight?: boolean;
  hasBus?: boolean;
  onViewDetails?: () => void;
  onEdit?: () => void;
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
  onEdit,
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
      <CardFooter className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onViewDetails}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
