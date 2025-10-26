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
    repeatPerParty?: boolean;
    answerTemplates?: Array<{
      title: string;
      value: string;
    }>;
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
    
    // Validar answerTemplates (se existir)
    if (card.answerTemplates) {
      if (!Array.isArray(card.answerTemplates)) {
        errors.push(`Card "${card.id}": answerTemplates deve ser um array`);
      } else {
        card.answerTemplates.forEach((template: any, tIdx: number) => {
          if (!template.title) {
            errors.push(`Card "${card.id}": answerTemplate ${tIdx + 1} requer "title"`);
          }
          if (!template.value) {
            errors.push(`Card "${card.id}": answerTemplate ${tIdx + 1} requer "value"`);
          }
        });
      }
    }
  });
  
  // Validar se placeholders no contractText têm cards correspondentes
  if (json.contractText && cardIds.size > 0) {
    const placeholders = detectPlaceholders(json.contractText);
    
    // Construir um mapa de cards para validação eficiente
    const cardsMap = new Map<string, any>(json.cards.map(card => [card.id, card]));
    
    const missingCards = placeholders.filter(placeholder => {
      // Verificar correspondência direta (caso normal)
      if (cardIds.has(placeholder) || cardIds.has(sanitizeVariableName(placeholder))) {
        return false; // Placeholder válido
      }
      
      // Verificar se termina com _formatted (campos repetíveis)
      if (placeholder.endsWith('_formatted')) {
        const baseId = placeholder.replace(/_formatted$/, '');
        const sanitizedBaseId = sanitizeVariableName(baseId);
        
        // Verificar se existe um card com o ID base
        if (cardIds.has(baseId) || cardIds.has(sanitizedBaseId)) {
          const card = cardsMap.get(baseId) || cardsMap.get(sanitizedBaseId);
          
          // Validar se o card tem repeatPerParty: true
          if (card && card.repeatPerParty === true) {
            return false; // Placeholder _formatted válido
          } else if (card) {
            // Card existe mas não tem repeatPerParty: true
            errors.push(
              `Placeholder "{{${placeholder}}}" usa sufixo _formatted mas o card "${card.id}" não tem "repeatPerParty": true`
            );
            return false; // Não adicionar como "missing", já foi reportado acima
          }
        }
      }
      
      return true; // Placeholder sem card correspondente
    });
    
    if (missingCards.length > 0) {
      errors.push(`Placeholders sem card correspondente: ${missingCards.join(', ')}`);
    }
    
    // Validar se cards com repeatPerParty: true usam _formatted no texto
    const repeatableCards = json.cards.filter((c: any) => c.repeatPerParty === true);
    const allPlaceholders = detectPlaceholders(json.contractText);
    
    repeatableCards.forEach((card: any) => {
      const expectedFormattedPlaceholder = `${card.id}_formatted`;
      const hasFormatted = allPlaceholders.includes(expectedFormattedPlaceholder);
      const hasBasic = allPlaceholders.includes(card.id);
      
      if (!hasFormatted && hasBasic) {
        errors.push(
          `⚠️ Card "${card.id}" tem "repeatPerParty": true mas usa {{${card.id}}} no texto. Use {{${card.id}_formatted}} para formatar corretamente.`
        );
      }
    });
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
    conditionalLogic: card.conditionalLogic,
    repeatPerParty: card.repeatPerParty || false,
    answerTemplates: card.answerTemplates
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
      version: 'v. 1.0',
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
