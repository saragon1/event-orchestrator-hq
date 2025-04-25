
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Resource {
  id: string;
  name: string;
  [key: string]: any;
}

interface ResourceManagementModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  availableResources: Resource[];
  assignedResources: Resource[];
  onAssign: (id: string) => void;
  onRemove: (id: string) => void;
  resourceType: 'person' | 'hotel';
}

export const ResourceManagementModal = ({
  title,
  isOpen,
  onClose,
  availableResources,
  assignedResources,
  onAssign,
  onRemove,
  resourceType,
}: ResourceManagementModalProps) => {
  const renderResourceDetails = (resource: Resource) => {
    if (resourceType === 'person') {
      return (
        <>
          <TableCell className="font-medium">{resource.name}</TableCell>
          <TableCell>{resource.email}</TableCell>
          <TableCell>{resource.role || '-'}</TableCell>
        </>
      );
    } else {
      return (
        <>
          <TableCell className="font-medium">{resource.name}</TableCell>
          <TableCell>{resource.city}</TableCell>
          <TableCell>{resource.rating ? `${resource.rating} ★` : '-'}</TableCell>
        </>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Available Resources Panel */}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold mb-4">
                Available {resourceType === 'person' ? 'Persons' : 'Hotels'}
              </h3>
              <ScrollArea className="flex-1 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>{resourceType === 'person' ? 'Email' : 'City'}</TableHead>
                      <TableHead>{resourceType === 'person' ? 'Role' : 'Rating'}</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableResources.map((resource) => (
                      <TableRow key={resource.id} className="group hover:bg-muted/50">
                        {renderResourceDetails(resource)}
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onAssign(resource.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {availableResources.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                          No available {resourceType === 'person' ? 'persons' : 'hotels'} found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Assigned Resources Panel */}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold mb-4">
                Assigned {resourceType === 'person' ? 'Persons' : 'Hotels'}
              </h3>
              <ScrollArea className="flex-1 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>{resourceType === 'person' ? 'Email' : 'City'}</TableHead>
                      <TableHead>{resourceType === 'person' ? 'Role' : 'Rating'}</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedResources.map((resource) => (
                      <TableRow key={resource.id} className="group hover:bg-muted/50">
                        {renderResourceDetails(resource)}
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemove(resource.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {assignedResources.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                          No {resourceType === 'person' ? 'persons' : 'hotels'} assigned yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
