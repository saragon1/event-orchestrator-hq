import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'user';
  has_companion: boolean;
  event_id: string;
  created_at: string;
}

interface Event {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export const EventRegistration: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hasCompanion, setHasCompanion] = useState<'yes' | 'no'>('no');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingEvent, setIsValidatingEvent] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    console.log('eventId', eventId);
    const validateEvent = async () => {
      if (!eventId) {
        toast.error('Evento non trovato');
        navigate('/events');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, name, start_date, end_date')
          .eq('id', eventId)
          .single();

        if (error) {
          console.error('Error fetching event:', error);
          toast.error('Evento non trovato');
          navigate('/events');
          return;
        }

        if (!data) {
          toast.error('Evento non trovato');
          navigate('/events');
          return;
        }

        // Check if the event is in the future
        const now = new Date();
        const eventStartDate = new Date(data.start_date);
        
        if (eventStartDate < now) {
          toast.error('Questo evento è già terminato');
          navigate('/events');
          return;
        }

        setEvent(data);
        setIsValidatingEvent(false);
      } catch (error) {
        console.error('Error validating event:', error);
        toast.error('Errore durante la validazione dell\'evento');
        navigate('/events');
      }
    };

    validateEvent();
  }, [eventId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !event) {
      toast.error('Evento non trovato');
      return;
    }

    // Validate required fields
    if (!name.trim()) {
      toast.error('Il nome è obbligatorio');
      return;
    }

    if (!email.trim()) {
      toast.error('L\'email è obbligatoria');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Inserisci un\'email valida');
      return;
    }

    setIsSubmitting(true);

    try {
      // First, create the person
      const { data: personData, error: personError } = await supabase
        .from('persons')
        .insert({
          name,
          email,
          phone: phone.trim() || null,
          role: 'user'
        })
        .select()
        .single();

      if (personError) throw personError;

      // Then, add the person to the event with companion flag
      const { error: eventPersonError } = await supabase
        .from('event_persons')
        .insert({
          person_id: personData.id,
          event_id: eventId,
          event_role: 'attendee',
          invite_status: 'confirmed',
          has_companion: hasCompanion === 'yes'
        });

      if (eventPersonError) throw eventPersonError;

      toast.success('Registrazione avvenuta con successo!', {
        position: 'top-center',
        style: {
          background: '#22c55e', // Verde brillante
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.25rem',
          boxShadow: '0 4px 24px 0 rgba(34,197,94,0.2)',
          borderRadius: '12px',
          padding: '1.5rem 2rem',
          border: '2px solid #16a34a',
        },
        icon: (
          <svg
            className="animate-bounce"
            width="32"
            height="32"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#fff"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
        duration: 6000, // Durata di 6 secondi
      });
      setName('');
      setEmail('');
      setPhone('');
      setHasCompanion('no');
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Errore durante la registrazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidatingEvent) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-6">
          <div className="text-center">Validazione evento in corso...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-2">Registrazione Evento</h2>
        {event && (
          <div className="text-muted-foreground mb-6">
            <p className="font-medium">{event.name}</p>
            <p>Data: {new Date(event.start_date).toLocaleDateString('it-IT')}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome e Cognome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Inserisci nome e cognome"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Inserisci la tua email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Inserisci il tuo numero di telefono (opzionale)"
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

    </div>
  );
}; 