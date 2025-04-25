
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

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
          <TableCell>{resource.email}</TableCell>
          <TableCell>{resource.role || '-'}</TableCell>
        </>
      );
    } else {
      return (
        <>
          <TableCell>{resource.city}</TableCell>
          <TableCell>{resource.rating || '-'}</TableCell>
        </>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {/* Available Resources Panel */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Available {resourceType === 'person' ? 'Persons' : 'Hotels'}</h3>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>{resourceType === 'person' ? 'Email' : 'City'}</TableHead>
                    <TableHead>{resourceType === 'person' ? 'Role' : 'Rating'}</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>{resource.name}</TableCell>
                      {renderResourceDetails(resource)}
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onAssign(resource.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Assigned Resources Panel */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Assigned {resourceType === 'person' ? 'Persons' : 'Hotels'}</h3>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>{resourceType === 'person' ? 'Email' : 'City'}</TableHead>
                    <TableHead>{resourceType === 'person' ? 'Role' : 'Rating'}</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>{resource.name}</TableCell>
                      {renderResourceDetails(resource)}
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemove(resource.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
