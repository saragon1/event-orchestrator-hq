
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
  isLoading?: boolean;
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
  isLoading = false,
}: ResourceManagementModalProps) => {
  
  const renderResourceDetails = (resource: Resource) => {
    if (resourceType === 'person') {
      return (
        <>
          <TableCell className="font-medium">{resource.name}</TableCell>
          <TableCell>{resource.email}</TableCell>
          <TableCell>
            {resource.role ? (
              <Badge variant="outline">{resource.role}</Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>
        </>
      );
    } else {
      return (
        <>
          <TableCell className="font-medium">{resource.name}</TableCell>
          <TableCell>{resource.city}</TableCell>
          <TableCell>
            {resource.rating ? (
              <span className="flex items-center">
                <Badge variant="secondary" className="mr-1">
                  {resource.rating}
                </Badge>
                <span className="text-amber-500">★</span>
              </span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>
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
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading resources...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Available Resources Panel */}
              <div className="flex flex-col border rounded-lg p-4 bg-background shadow-sm">
                <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
                  <span>Available {resourceType === 'person' ? 'Persons' : 'Hotels'}</span>
                  <Badge variant="outline">{availableResources.length}</Badge>
                </h3>
                <ScrollArea className="flex-1 pr-4">
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
                        <TableRow key={resource.id} className="group hover:bg-muted/50 transition-colors">
                          {renderResourceDetails(resource)}
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAssign(resource.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus className="h-4 w-4 text-primary" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {availableResources.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                              <p>No available {resourceType === 'person' ? 'persons' : 'hotels'} found</p>
                              <p className="text-sm text-muted-foreground">
                                All {resourceType === 'person' ? 'persons' : 'hotels'} have been assigned
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Assigned Resources Panel */}
              <div className="flex flex-col border rounded-lg p-4 bg-background shadow-sm">
                <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
                  <span>Assigned {resourceType === 'person' ? 'Persons' : 'Hotels'}</span>
                  <Badge>{assignedResources.length}</Badge>
                </h3>
                <ScrollArea className="flex-1 pr-4">
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
                        <TableRow key={resource.id} className="group hover:bg-muted/50 transition-colors">
                          {renderResourceDetails(resource)}
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemove(resource.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {assignedResources.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                              <p>No {resourceType === 'person' ? 'persons' : 'hotels'} assigned yet</p>
                              <p className="text-sm text-muted-foreground">
                                Use the "+" button to assign {resourceType === 'person' ? 'persons' : 'hotels'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
