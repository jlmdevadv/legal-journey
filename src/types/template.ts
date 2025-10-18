
export interface TemplateVersion {
  version: string;
  date?: string;
  createdDate?: string;
  history?: Array<{
    version: string;
    date: string;
    changes: string;
    template_snapshot?: string;
  }>;
}

export interface ContractField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'tel' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  helpText?: string;
  helpVideo?: string;
  howToFill?: string;
  whyImportant?: string;
  videoLink?: string;
  aiAssistantLink?: string;
}

export interface PartyData {
  id: string;
  fullName: string;
  nationality: string;
  maritalStatus: string;
  cpf: string;
  address: string;
  city: string;
  state: string;
  partyType: 'Contratante' | 'Anuente' | 'Fiador' | 'Avalista' | 'Testemunha';
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  fields: ContractField[];
  version?: TemplateVersion;
  usePartySystem?: boolean;
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
  created_by?: string;
  last_modified_by?: string;
}
