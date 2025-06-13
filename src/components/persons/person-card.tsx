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
import { Eye, Pencil, Hotel, Plane, Bus, Car, Trash } from "lucide-react";

interface PersonCardProps {
  id: string;
  name: string;
  email: string;
  role?: string;
  hasHotel?: boolean;
  hasFlight?: boolean;
  hasBus?: boolean;
  hasCar?: boolean;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const PersonCard = ({
  id,
  name,
  email,
  role,
  hasHotel = false,
  hasFlight = false,
  hasBus = false,
  hasCar = false,
  onViewDetails,
  onEdit,
  onDelete,
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
            {hasCar && (
              <Badge variant="secondary" className="flex gap-1">
                <Car className="h-3 w-3" />
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
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
