
export interface AnswerTemplate {
  title: string;
  value: string;
}

export interface PartyType {
  id: string;
  name: string;
  category: 'main' | 'other';
  description?: string;
  is_default: boolean;
  display_order: number;
}

export interface FieldCondition {
  fieldId: string;           // ID do campo que controla a visibilidade
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | number;    // Valor que dispara a condição
  logicOperator?: 'AND' | 'OR'; // Para múltiplas condições
}

export interface ConditionalLogic {
  conditions: FieldCondition[];
  action: 'show' | 'hide';   // Ação quando condições forem satisfeitas
}

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
  conditionalLogic?: ConditionalLogic; // Lógica de visibilidade condicional
  repeatPerParty?: boolean; // Campo repetível para cada parte principal
  answerTemplates?: AnswerTemplate[]; // Modelos de resposta pré-formatados
}

export interface RepeatableFieldResponse {
  fieldId: string;
  responses: {
    partyId: string;
    partyName: string;
    value: string;
  }[];
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
  partyType: string;
  category: 'main' | 'other';
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
