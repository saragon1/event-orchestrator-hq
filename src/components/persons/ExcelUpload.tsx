import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useEventStore } from "@/stores/event-store";
import { Download } from "lucide-react";
import { Enums } from "@/integrations/supabase/types";

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportResult = {
  newlyImported: { name: string; email: string }[];
  alreadyExisting: { name: string; email: string }[];
};

export const ExcelUpload = ({ isOpen, onClose, onSuccess }: ExcelUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [addToCurrentEvent, setAddToCurrentEvent] = useState(true);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const selectedEventId = useEventStore((state) => state.selectedEventId);

  // Funzione di utilità per trovare il valore di una colonna ignorando maiuscole/minuscole e spazi
  const getValue = (row: Record<string, string>, possibleKeys: string[]) => {
    for (const key of Object.keys(row)) {
      for (const target of possibleKeys) {
        if (key.trim().toLowerCase() === target.trim().toLowerCase()) {
          return row[key];
        }
      }
    }
    return undefined;
  };

  const createSampleFile = () => {
    // Create a sample worksheet
    const sampleData = [
      {
        "Name": "John Doe",
        "Email": "john.doe@example.com",
        "Phone Number": "+1234567890",
        "Invite Status": "confirmed"
      },
      {
        "Name": "Jane Smith",
        "Email": "jane.smith@example.com",
        "Phone Number": "+0987654321",
        "Invite Status": "invited"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Persons");

    // Download the file
    XLSX.writeFile(workbook, "persons_sample.xlsx");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setImportResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const newlyImported: { name: string; email: string }[] = [];
          const alreadyExisting: { name: string; email: string }[] = [];

          // Process each row
          for (const row of jsonData as Record<string, string>[]) {
            const personData = {
              name: getValue(row, ["Nome e Cognome", "Name", "Nome", "nome"]),
              email: getValue(row, ["Email", "email"]),
              phone: getValue(row, [
                "Numero di Telefono",
                "Numero di telefono",
                "Phone Number",
                "phone number"
              ]) || null,
            };

            // Verifica che i dati obbligatori siano presenti
            if (!personData.name || !personData.email) {
              throw new Error(`Dati mancanti nella riga: ${JSON.stringify(row)}`);
            }

            // Check if person already exists
            const { data: existingPersons, error: checkError } = await supabase
              .from("persons")
              .select("id")
              .eq("email", personData.email)
              .maybeSingle();

            if (checkError) {
              throw new Error(`Errore database: ${checkError.message}`);
            }

            if (existingPersons) {
              // Person already exists
              alreadyExisting.push({ name: personData.name, email: personData.email });

              // If add to current event is checked, proceed with adding the existing person to the event
              if (addToCurrentEvent && selectedEventId) {
                await addPersonToEvent(
                  existingPersons.id, 
                  getValue(row, ["Invite Status", "invite status"]) as Enums<"invite_status"> || "invited"
                );
              }
            } else {
              // Insert new person
              const { data: newPerson, error } = await supabase
                .from("persons")
                .insert([personData])
                .select("id")
                .single();

              if (error) {
                throw new Error(`Errore database: ${error.message}`);
              }

              newlyImported.push({ name: personData.name, email: personData.email });

              // If add to current event is checked, add the new person to the event
              if (addToCurrentEvent && selectedEventId && newPerson) {
                await addPersonToEvent(
                  newPerson.id, 
                  getValue(row, ["Invite Status", "invite status"]) as Enums<"invite_status"> || "invited"
                );
              }
            }
          }

          setImportResults({ newlyImported, alreadyExisting });

          toast({
            title: "Success",
            description: `Imported ${newlyImported.length} new persons. ${alreadyExisting.length} persons already existed.`,
          });
          
          onSuccess();
        } catch (error) {
          console.error("Error processing Excel file:", error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to process Excel file",
            variant: "destructive",
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to read file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addPersonToEvent = async (personId: string, inviteStatus: Enums<"invite_status">) => {
    if (!selectedEventId) return;

    // Check if person is already in event
    const { data: existingEventPerson } = await supabase
      .from("event_persons")
      .select("id")
      .eq("event_id", selectedEventId)
      .eq("person_id", personId)
      .maybeSingle();

    if (existingEventPerson) {
      // Already exists, no need to add again
      return;
    }

    // Add to event_persons table
    await supabase
      .from("event_persons")
      .insert([{
        event_id: selectedEventId,
        person_id: personId,
        invite_status: inviteStatus,
      }]);
  };

  const handleClose = () => {
    setImportResults(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Persons from Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload an Excel file containing person information. The file should have columns for:
            Nome e Cognome (Name), Email, and optionally Phone Number and Invite Status.
          </p>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 w-full justify-center"
            onClick={createSampleFile}
          >
            <Download className="h-4 w-4" />
            Download Sample Excel File
          </Button>

          <div className="border-2 border-dashed rounded-lg p-6">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          {selectedEventId && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="add-to-event" 
                checked={addToCurrentEvent} 
                onCheckedChange={(checked) => setAddToCurrentEvent(checked as boolean)}
              />
              <label 
                htmlFor="add-to-event" 
                className="text-sm cursor-pointer"
              >
                Automatically add imported persons to current event
              </label>
            </div>
          )}

          {isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              Processing file...
            </div>
          )}

          {importResults && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold">Import Results</h3>
                <div className="text-xs text-muted-foreground">
                  {importResults.newlyImported.length} new persons imported, {importResults.alreadyExisting.length} already exist
                </div>
              </div>

              {importResults.newlyImported.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Newly Imported:</h4>
                  <div className="max-h-40 overflow-y-auto mt-1 border rounded-md p-2">
                    {importResults.newlyImported.map((person, i) => (
                      <div key={`new-${i}`} className="text-xs py-1">
                        {person.name} ({person.email})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResults.alreadyExisting.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Already Existing:</h4>
                  <div className="max-h-40 overflow-y-auto mt-1 border rounded-md p-2">
                    {importResults.alreadyExisting.map((person, i) => (
                      <div key={`existing-${i}`} className="text-xs py-1">
                        {person.name} ({person.email})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 