import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useEventStore } from '@/stores/event-store';

interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  has_companion: boolean;
  event_id: string;
  created_at: string;
}

export const EventRegistration: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hasCompanion, setHasCompanion] = useState<'yes' | 'no'>('no');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedEventId } = useEventStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Nessun evento selezionato');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          first_name: firstName,
          last_name: lastName,
          has_companion: hasCompanion === 'yes',
          event_id: selectedEventId
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Registrazione completata con successo!');
      setFirstName('');
      setLastName('');
      setHasCompanion('no');
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Errore durante la registrazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToExcel = async () => {
    if (!selectedEventId) {
      toast.error('Nessun evento selezionato');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(
        data.map(reg => ({
          'Nome e Cognome': `${reg.first_name} ${reg.last_name}`,
          'Accompagnatore': reg.has_companion ? 'Si' : 'No'
        }))
      );

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Registrazioni');

      // Save file
      XLSX.writeFile(wb, 'registrazioni_evento.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Errore durante l\'esportazione del file Excel');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Registrazione Evento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Cognome</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Porterai un accompagnatore?</Label>
            <RadioGroup
              value={hasCompanion}
              onValueChange={(value) => setHasCompanion(value as 'yes' | 'no')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Si</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No</Label>
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Registrazione in corso...' : 'Registrati'}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Esporta Registrazioni</h3>
        <Button onClick={exportToExcel} variant="outline" className="w-full">
          Scarica Lista Registrazioni (Excel)
        </Button>
      </Card>
    </div>
  );
}; 