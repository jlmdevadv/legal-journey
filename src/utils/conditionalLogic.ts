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
 * Avalia todas as condições de um campo
 */
export const evaluateConditionalLogic = (
  logic: ConditionalLogic | undefined,
  formValues: Record<string, string>
): boolean => {
  if (!logic || logic.conditions.length === 0) {
    return true; // Sem condições = sempre visível
  }

  const results = logic.conditions.map(condition => 
    evaluateCondition(condition, formValues)
  );

  // Determinar operador lógico (AND ou OR)
  // Se alguma condição tem OR, usa OR entre todas; caso contrário, usa AND
  const useOrLogic = logic.conditions.some(c => c.logicOperator === 'OR');
  
  const isConditionMet = useOrLogic
    ? results.some(r => r)  // Pelo menos uma true (OR)
    : results.every(r => r); // Todas true (AND)

  // Se action é "show", retorna true quando condições satisfeitas
  // Se action é "hide", retorna false quando condições satisfeitas
  return logic.action === 'show' ? isConditionMet : !isConditionMet;
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
 */
export const getRepeatableFields = (fields: ContractField[]): ContractField[] => {
  return fields.filter(field => field.repeatPerParty === true);
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
