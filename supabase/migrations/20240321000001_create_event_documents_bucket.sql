-- Create a new storage bucket for event documents
insert into storage.buckets (id, name, public)
values ('event-documents', 'event-documents', false);

-- Set up storage policies
create policy "Users can upload their own event documents"
on storage.objects for insert
with check (
    bucket_id = 'event-documents' AND
    auth.uid() = owner
);

create policy "Users can view their own event documents"
on storage.objects for select
using (
    bucket_id = 'event-documents' AND
    auth.uid() = owner
);

create policy "Users can delete their own event documents"
on storage.objects for delete
using (
    bucket_id = 'event-documents' AND
    auth.uid() = owner
); 