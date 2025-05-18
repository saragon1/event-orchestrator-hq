import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseFormModal } from "@/components/expenses/expense-form-modal";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2, Edit2, Download, Upload, Share2 } from "lucide-react";
import { useEventStore } from "@/stores/event-store";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Database } from "@/integrations/supabase/types";
import * as XLSX from 'xlsx';

type ExpenseCategory = Database["public"]["Enums"]["event_expenses_category"];

interface Expense {
  id: string;
  event_id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  created_at: string | null;
  category: ExpenseCategory;
  resource_id: string | null;
}

export function EventExpenses() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedEventId } = useEventStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!selectedEventId) {
      toast({
        title: "No event selected",
        description: "Please select an event first",
        variant: "destructive",
      });
      navigate("/events");
      return;
    }
    fetchExpenses();
  }, [selectedEventId]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("event_expenses")
        .select(`
          id,
          event_id,
          type,
          description,
          amount,
          date,
          created_at,
          category,
          resource_id
        `)
        .eq("event_id", selectedEventId)
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from("event_expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;
      
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (expense: Expense) => {
    if (selectedExpense) {
      setExpenses(expenses.map(e => e.id === expense.id ? expense : e));
    } else {
      setExpenses([expense, ...expenses]);
    }
    setIsModalOpen(false);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expensesByType = expenses.reduce((acc, expense) => {
    acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleExportToExcel = async () => {
    if (!expenses.length) {
      toast({
        title: "No expenses",
        description: "There are no expenses to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(expenses.map(expense => ({
        Date: format(new Date(expense.date), "PPP"),
        Type: expense.type,
        Category: expense.category,
        Description: expense.description,
        Amount: expense.amount,
      })));

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Expenses");

      // Generate Excel file
      XLSX.writeFile(wb, `event-expenses-${selectedEventId}.xlsx`);

      toast({
        title: "Success",
        description: "Expenses exported to Excel successfully",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error",
        description: "Failed to export expenses to Excel. Please make sure you have the necessary permissions.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData.length) {
            toast({
              title: "Empty file",
              description: "The Excel file contains no data",
              variant: "destructive",
            });
            return;
          }

          // Process each row and create expenses
          for (const row of jsonData) {
            const expenseData = {
              event_id: selectedEventId,
              type: (row as any).Type?.toLowerCase() || 'other',
              category: (row as any).Category?.toLowerCase() || 'other',
              description: (row as any).Description || '',
              amount: parseFloat((row as any).Amount) || 0,
              date: new Date((row as any).Date).toISOString().split('T')[0],
            };

            const { error } = await supabase
              .from("event_expenses")
              .insert(expenseData);

            if (error) throw error;
          }

          // Refresh expenses list
          await fetchExpenses();

          toast({
            title: "Success",
            description: "Expenses imported from Excel successfully",
          });
        } catch (error) {
          console.error("Error processing Excel file:", error);
          toast({
            title: "Error",
            description: "Failed to process Excel file. Please check the file format and try again.",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error importing from Excel:", error);
      toast({
        title: "Error",
        description: "Failed to import expenses from Excel",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleShare = async () => {
    if (!expenses.length) {
      toast({
        title: "No expenses",
        description: "There are no expenses to share",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate Excel file
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(expenses.map(expense => ({
        Date: format(new Date(expense.date), "PPP"),
        Type: expense.type,
        Category: expense.category,
        Description: expense.description,
        Amount: expense.amount,
      })));
      XLSX.utils.book_append_sheet(wb, ws, "Expenses");

      // Convert to blob
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });

      // Create shareable link using Supabase Storage
      const fileName = `event-expenses-${selectedEventId}-${Date.now()}.xlsx`;
      
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();

      if (bucketsError) throw bucketsError;

      const sharedExpensesBucket = buckets.find(b => b.name === 'shared-expenses');
      if (!sharedExpensesBucket) {
        toast({
          title: "Error",
          description: "Storage bucket not found. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from('shared-expenses')
        .upload(fileName, blob);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shared-expenses')
        .getPublicUrl(fileName);

      // Copy to clipboard
      await navigator.clipboard.writeText(publicUrl);
      
      toast({
        title: "Success",
        description: "Shareable link copied to clipboard",
      });
    } catch (error) {
      console.error("Error sharing expenses:", error);
      toast({
        title: "Error",
        description: "Failed to generate shareable link. Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Event Expenses">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button onClick={handleAdd}>Add Expense</Button>
            <Button 
              variant="outline" 
              onClick={handleExportToExcel}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export to Excel"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('excel-upload')?.click()}
              disabled={isImporting}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? "Importing..." : "Import from Excel"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportFromExcel}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">€{totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(expensesByType).map(([type, amount]) => (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type}</span>
                    <span>€{amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize">{category}</span>
                    <span>€{amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), "PPP")}</TableCell>
                    <TableCell className="capitalize">{expense.type}</TableCell>
                    <TableCell className="capitalize">{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>€{expense.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ExpenseFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          expense={selectedExpense}
          eventId={selectedEventId!}
          onSuccess={handleModalSuccess}
        />
      </div>
    </DashboardLayout>
  );
} 