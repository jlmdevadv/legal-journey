
export interface TemplateVersion {
  version: string;
  date: string;
  createdDate?: string;
}

export interface ContractField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'tel';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  helpText?: string;
  helpVideo?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  fields: ContractField[];
  version?: TemplateVersion;
}
