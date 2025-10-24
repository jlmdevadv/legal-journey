import { ContractTemplate as TypeTemplate, ContractField as TypeField } from '@/types/template';
import { ContractTemplate, ContractField } from '@/data/contractTemplates';
import { detectPlaceholders, sanitizeVariableName } from './templateUtils';

export interface TemplateImportJSON {
  templateName: string;
  templateDescription?: string;
  contractText: string;
  cards: Array<{
    id: string;
    title: string;
    type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'tel' | 'date';
    placeholder?: string;
    required?: boolean;
    options?: string[];
    helpText?: {
      how?: string;
      why?: string;
    };
    videoLink?: string;
    aiAssistantLink?: string;
    conditionalLogic?: {
      conditions: Array<{
        fieldId: string;
        operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
        value: string | number;
        logicOperator?: 'AND' | 'OR';
      }>;
      action: 'show' | 'hide';
    };
  }>;
  usePartySystem?: boolean;
}

export const validateTemplateJSON = (json: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validar campos obrigatórios
  if (!json.templateName?.trim()) {
    errors.push('Campo "templateName" é obrigatório');
  }
  
  if (!json.contractText?.trim()) {
    errors.push('Campo "contractText" é obrigatório');
  }
  
  if (!Array.isArray(json.cards)) {
    errors.push('Campo "cards" deve ser um array');
    return { valid: false, errors };
  }
  
  // Validar cada card
  const cardIds = new Set<string>();
  json.cards.forEach((card: any, index: number) => {
    // ID obrigatório
    if (!card.id) {
      errors.push(`Card ${index + 1}: campo "id" é obrigatório`);
    } else {
      // Verificar IDs duplicados
      if (cardIds.has(card.id)) {
        errors.push(`Card ${index + 1}: ID "${card.id}" duplicado`);
      }
      cardIds.add(card.id);
    }
    
    // Title obrigatório
    if (!card.title) {
      errors.push(`Card "${card.id || index + 1}": campo "title" é obrigatório`);
    }
    
    // Type obrigatório e válido
    if (!card.type) {
      errors.push(`Card "${card.id || index + 1}": campo "type" é obrigatório`);
    } else {
      const validTypes = ['text', 'textarea', 'select', 'number', 'email', 'tel', 'date'];
      if (!validTypes.includes(card.type)) {
        errors.push(`Card "${card.id}": tipo "${card.type}" inválido. Tipos válidos: ${validTypes.join(', ')}`);
      }
      
      // Se for select, options é obrigatório
      if (card.type === 'select' && !Array.isArray(card.options)) {
        errors.push(`Card "${card.id}": campos do tipo "select" requerem array "options"`);
      }
    }
    
    // Validar lógica condicional (se existir)
    if (card.conditionalLogic) {
      if (!Array.isArray(card.conditionalLogic.conditions)) {
        errors.push(`Card "${card.id}": conditionalLogic.conditions deve ser um array`);
      }
      
      if (!['show', 'hide'].includes(card.conditionalLogic.action)) {
        errors.push(`Card "${card.id}": conditionalLogic.action deve ser "show" ou "hide"`);
      }
    }
  });
  
  // Validar se placeholders no contractText têm cards correspondentes
  if (json.contractText && cardIds.size > 0) {
    const placeholders = detectPlaceholders(json.contractText);
    const missingCards = placeholders.filter(p => !cardIds.has(p) && !cardIds.has(sanitizeVariableName(p)));
    
    if (missingCards.length > 0) {
      errors.push(`Placeholders sem card correspondente: ${missingCards.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const convertJSONToTemplate = (json: TemplateImportJSON): ContractTemplate => {
  const timestamp = Date.now();
  const today = new Date().toLocaleDateString('pt-BR');
  
  // Converter cards para fields
  const fields: ContractField[] = json.cards.map(card => ({
    id: card.id,
    label: card.title,
    type: card.type,
    placeholder: card.placeholder,
    required: card.required ?? true, // Default: required
    options: card.options,
    howToFill: card.helpText?.how,
    whyImportant: card.helpText?.why,
    videoLink: card.videoLink,
    aiAssistantLink: card.aiAssistantLink,
    conditionalLogic: card.conditionalLogic
  }));
  
  // Converter {{placeholders}} para [field-id] no texto do contrato
  let templateText = json.contractText;
  const placeholders = detectPlaceholders(templateText);
  
  placeholders.forEach(placeholder => {
    const fieldId = sanitizeVariableName(placeholder);
    const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
    templateText = templateText.replace(regex, `[${fieldId}]`);
  });
  
  const isoDate = new Date().toISOString();
  
  return {
    id: `custom-${timestamp}`,
    name: json.templateName,
    description: json.templateDescription || 'Template importado via JSON',
    template: templateText,
    fields,
    version: {
      version: '1.0',
      date: today,
      createdDate: today
    },
    usePartySystem: json.usePartySystem ?? true
  };
};

export const getTemplateStats = (json: TemplateImportJSON) => {
  const placeholders = detectPlaceholders(json.contractText);
  
  return {
    totalCards: json.cards.length,
    totalPlaceholders: placeholders.length,
    requiredFields: json.cards.filter(c => c.required !== false).length,
    conditionalFields: json.cards.filter(c => c.conditionalLogic).length
  };
};
