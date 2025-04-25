
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResourceManagementSectionProps {
  title: string;
  description: string;
  onManageClick: () => void;
  disabled: boolean;
}

export const ResourceManagementSection = ({
  title,
  description,
  onManageClick,
  disabled,
}: ResourceManagementSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {title}
          <Button size="sm" variant="outline" onClick={onManageClick} disabled={disabled}>
            Manage
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};
