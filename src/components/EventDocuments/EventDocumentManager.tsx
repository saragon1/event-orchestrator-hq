import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { EventDocument } from '@/types/event-document';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EventDocumentList } from './EventDocumentList';

interface EventDocumentManagerProps {
    eventId: string;
}

export const EventDocumentManager: React.FC<EventDocumentManagerProps> = ({ eventId }) => {
    const [documents, setDocuments] = useState<EventDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [eventId]);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('event_documents')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast.error('Errore durante il caricamento dei documenti');
        }
    };

    const onDrop = async (acceptedFiles: File[]) => {
        try {
            setIsUploading(true);
            for (const file of acceptedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${eventId}/${fileName}`;

                // Upload file to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('event-documents')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Create document record
                const { data, error } = await supabase
                    .from('event_documents')
                    .insert({
                        event_id: eventId,
                        file_name: file.name,
                        file_url: filePath,
                    })
                    .select()
                    .single();

                if (error) throw error;

                setDocuments(prev => [data, ...prev]);
                toast.success('File caricato con successo');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Errore durante il caricamento del file');
        } finally {
            setIsUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        }
    });

    const handleDocumentDelete = (documentId: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    };

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}`}>
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <p>Rilascia i file qui...</p>
                    ) : (
                        <div>
                            <p>Trascina qui i file Excel o clicca per selezionarli</p>
                            <p className="text-sm text-gray-500">Supporta file .xlsx e .xls</p>
                        </div>
                    )}
                </div>
            </Card>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Documenti caricati</h3>
                <EventDocumentList
                    documents={documents}
                    onDocumentDelete={handleDocumentDelete}
                />
            </div>
        </div>
    );
}; 