
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
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'tel' | 'date' | 'info';
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
  answerTemplateMode?: 'replace' | 'append'; // Modo de inserção de answerTemplates
  includeValueInContract?: boolean; // Se valor de select deve aparecer no contrato (padrão: true)
  infoContent?: string; // Conteúdo para cards informativos (type='info')
  display_order?: number; // Ordem de exibição dos campos
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
  fullName: string;           // PF: Nome Completo | PJ: Razão Social
  nationality: string;        // PF only
  maritalStatus: string;      // PF only
  profession?: string;        // PF only (opcional)
  cpf: string;                // PF: CPF | PJ: CNPJ
  email?: string;             // Opcional
  address: string;            // PF: endereço residencial | PJ: sede
  city: string;
  state: string;
  partyType: string;
  category: 'main' | 'other';
  
  // ✅ Suporte a Pessoa Jurídica (v3.2)
  personType: 'PF' | 'PJ';    // Padrão: 'PF' (retrocompatibilidade)
  
  // Representante Legal (apenas quando personType === 'PJ')
  hasRepresentative?: boolean;    // Toggle para habilitar representante
  representativeName?: string;    // Nome completo do representante
  representativeRole?: string;    // Cargo: "Sócio-Administrador", "Diretor", etc.
  representativeCpf?: string;     // CPF do representante
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
  organization_id?: string | null;
}
