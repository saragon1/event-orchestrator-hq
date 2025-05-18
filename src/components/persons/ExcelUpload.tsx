import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelUpload = ({ isOpen, onClose, onSuccess }: ExcelUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Funzione di utilità per trovare il valore di una colonna ignorando maiuscole/minuscole e spazi
  const getValue = (row: any, possibleKeys: string[]) => {
    for (const key of Object.keys(row)) {
      for (const target of possibleKeys) {
        if (key.trim().toLowerCase() === target.trim().toLowerCase()) {
          return row[key];
        }
      }
    }
    return undefined;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Process each row
          for (const row of jsonData) {
            const personData = {
              name: getValue(row, ["Nome e Cognome", "Name"]),
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

            // Insert into database
            const { error } = await supabase
              .from("persons")
              .insert([personData]);

            if (error) {
              throw new Error(`Errore database: ${error.message}`);
            }
          }

          toast({
            title: "Success",
            description: "Persons imported successfully",
          });
          onSuccess();
          onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Persons from Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload an Excel file containing person information. The file should have columns for:
            Nome e Cognome (Name), Email, and Numero di Telefono (Phone Number).
          </p>
          <div className="border-2 border-dashed rounded-lg p-6">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="w-full"
              disabled={isLoading}
            />
          </div>
          {isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              Processing file...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 