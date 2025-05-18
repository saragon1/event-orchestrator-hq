-- Create event_documents table
create table if not exists event_documents (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references events(id) on delete cascade,
    file_name text not null,
    file_url text not null,
    uploaded_by uuid references auth.users(id),
    upload_date timestamp with time zone default now(),
    last_modified timestamp with time zone default now(),
    status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
    comments text,
    version integer default 1,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create RLS policies
alter table event_documents enable row level security;

create policy "Users can view their own event documents"
    on event_documents for select
    using (auth.uid() = uploaded_by);

create policy "Users can insert their own event documents"
    on event_documents for insert
    with check (auth.uid() = uploaded_by);

create policy "Users can update their own event documents"
    on event_documents for update
    using (auth.uid() = uploaded_by);

-- Create function to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger update_event_documents_updated_at
    before update on event_documents
    for each row
    execute function update_updated_at_column(); 