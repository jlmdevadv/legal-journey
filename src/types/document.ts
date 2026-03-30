
export type DocumentFormat = 'txt' | 'docx' | 'pdf';

export interface DocumentData {
  title: string;
  content: string;
  parties: string;
  otherInvolved: string;
  signatures: string;
  locationDate?: string;
}

export interface DownloadOptions {
  format: DocumentFormat;
  filename: string;
  elementId?: string;
}

export interface ContractEvent {
  id: string;
  contract_id: string;
  user_id: string | null;
  event_type:
    | 'link_created'
    | 'contract_accessed'
    | 'submitted_for_review'
    | 'review_approved'
    | 'review_rejected'
    | 'document_downloaded';
  occurred_at: string;
  metadata: Record<string, unknown> | null;
}
