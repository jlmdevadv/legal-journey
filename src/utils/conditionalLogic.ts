import { FieldCondition, ConditionalLogic, ContractField } from '@/types/template';

/**
 * Avalia se uma condição individual é satisfeita
 */
export const evaluateCondition = (
  condition: FieldCondition,
  formValues: Record<string, string>
): boolean => {
  const fieldValue = formValues[condition.fieldId];
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === String(condition.value);
    case 'notEquals':
      return fieldValue !== String(condition.value);
    case 'contains':
      return fieldValue?.includes(String(condition.value)) || false;
    case 'greaterThan':
      return Number(fieldValue) > Number(condition.value);
    case 'lessThan':
      return Number(fieldValue) < Number(condition.value);
    default:
      return false;
  }
};

/**
 * Avalia todas as condições de um campo com lógica AND/OR correta
 */
export const evaluateConditionalLogic = (
  logic: ConditionalLogic | undefined,
  formValues: Record<string, string>
): boolean => {
  if (!logic || logic.conditions.length === 0) {
    return true; // Sem condições = sempre visível
  }

  // Avaliar cada condição
  const results = logic.conditions.map(condition => 
    evaluateCondition(condition, formValues)
  );

  // Aplicar operadores lógicos corretamente
  // Percorre as condições aplicando AND/OR de forma sequencial
  let finalResult = results[0];
  
  for (let i = 1; i < logic.conditions.length; i++) {
    const operator = logic.conditions[i - 1].logicOperator || 'AND';
    
    if (operator === 'OR') {
      finalResult = finalResult || results[i];
    } else { // AND
      finalResult = finalResult && results[i];
    }
  }

  // Se action é "show", retorna true quando condições satisfeitas
  // Se action é "hide", retorna false quando condições satisfeitas
  return logic.action === 'show' ? finalResult : !finalResult;
};

/**
 * Filtra campos visíveis com base nas condições
 */
export const getVisibleFields = (
  fields: ContractField[],
  formValues: Record<string, string>
): ContractField[] => {
  return fields.filter(field => 
    evaluateConditionalLogic(field.conditionalLogic, formValues)
  );
};

/**
 * Retorna apenas os campos marcados para repetição por parte
 * AVISO: Esta função NÃO aplica lógica condicional
 * Use getRepeatableVisibleFields() se precisar aplicar conditionalLogic
 */
export const getRepeatableFields = (fields: ContractField[]): ContractField[] => {
  return fields.filter(field => field.repeatPerParty === true);
};

/**
 * Retorna campos repetíveis E visíveis (aplica conditionalLogic)
 */
export const getRepeatableVisibleFields = (
  fields: ContractField[],
  formValues: Record<string, string>
): ContractField[] => {
  return getVisibleFields(fields, formValues).filter(field => field.repeatPerParty === true);
};

/**
 * Retorna campos visíveis E não repetíveis
 */
export const getNonRepeatableVisibleFields = (
  fields: ContractField[],
  formValues: Record<string, string>
): ContractField[] => {
  return getVisibleFields(fields, formValues).filter(field => !field.repeatPerParty);
};
