import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventDocument } from '@/types/event-document';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EventDocumentListProps {
    documents: EventDocument[];
    onDocumentDelete: (documentId: string) => void;
}

export const EventDocumentList: React.FC<EventDocumentListProps> = ({
    documents,
    onDocumentDelete
}) => {
    const handleDownload = async (document: EventDocument) => {
        try {
            const { data, error } = await supabase.storage
                .from('event-documents')
                .download(document.fileUrl);

            if (error) throw error;

            // Create a download link
            const url = URL.createObjectURL(data);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = document.fileName;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Errore durante il download del file');
        }
    };

    const handleDelete = async (document: EventDocument) => {
        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('event-documents')
                .remove([document.fileUrl]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await supabase
                .from('event_documents')
                .delete()
                .eq('id', document.id);

            if (dbError) throw dbError;

            onDocumentDelete(document.id);
            toast.success('Documento eliminato con successo');
        } catch (error) {
            console.error('Error deleting document:', error);
            toast.error('Errore durante l\'eliminazione del documento');
        }
    };

    return (
        <div className="space-y-4">
            {documents.map((doc) => (
                <Card key={doc.id} className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{doc.fileName}</p>
                            <p className="text-sm text-gray-500">
                                Caricato il {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                                Stato: {doc.status}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleDownload(doc)}
                            >
                                Scarica
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleDelete(doc)}
                            >
                                Elimina
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}; 