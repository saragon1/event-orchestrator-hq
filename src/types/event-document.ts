export type EventDocumentStatus = 'pending' | 'approved' | 'rejected';

export interface EventDocument {
    id: string;
    eventId: string;
    fileName: string;
    fileUrl: string;
    uploadedBy: string;
    uploadDate: Date;
    lastModified: Date;
    status: EventDocumentStatus;
    comments?: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventDocumentUpload {
    eventId: string;
    file: File;
    comments?: string;
}

export interface EventDocumentUpdate {
    status?: EventDocumentStatus;
    comments?: string;
} 