
  useEffect(() => {
    const fetchPersons = async () => {
      // Fetch persons associated with the event through the event_persons junction table
      const { data, error } = await supabase
        .from('event_persons')
        .select('person_id, persons:person_id(id, name)')
        .eq('event_id', eventId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch persons",
          variant: "destructive",
        });
        return;
      }
      
      // Transform the data to get a clean array of persons
      const personsData = data?.map(item => ({
        id: item.persons.id,
        name: item.persons.name
      })) || [];
      
      setPersons(personsData);
    };

    const fetchTicket = async () => {
      if (!ticketId) return;
      
      const table = type === 'flight' ? 'flight_tickets' : 'bus_tickets';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch ticket details",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        form.reset({
          person_id: data.person_id,
          seat: data.seat || "",
          confirmation_number: data.confirmation_number || "",
          notes: data.notes || "",
        });
      }
    };

    fetchPersons();
    fetchTicket();
  }, [eventId, ticketId, form, toast, type]);
