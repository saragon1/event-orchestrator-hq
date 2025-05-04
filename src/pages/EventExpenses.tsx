import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseFormModal } from "@/components/expenses/expense-form-modal";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2, Edit2 } from "lucide-react";
import { useEventStore } from "@/stores/event-store";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Database } from "@/integrations/supabase/types";

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout title="Event Expenses">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={handleAdd}>Add Expense</Button>
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