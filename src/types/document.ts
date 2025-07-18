
export type DocumentFormat = 'txt' | 'docx' | 'pdf';

export interface DocumentData {
  title: string;
  content: string;
  parties: string;
  otherInvolved: string;
  signatures: string;
}

export interface DownloadOptions {
  format: DocumentFormat;
  filename: string;
  elementId?: string;
}
