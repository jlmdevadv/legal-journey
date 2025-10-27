import { ContractField, PartyData, RepeatableFieldResponse } from '@/types/template';
import { getNonRepeatableVisibleFields, getRepeatableVisibleFields } from './conditionalLogic';

export interface ValidationResult {
  isValid: boolean;
  invalidFieldIds: Set<string>;
  invalidRepeatableFields: Map<string, Set<string>>; // fieldId -> Set<partyId>
}

/**
 * Valida todos os campos obrigatórios visíveis
 * @returns Objeto com status de validação e IDs dos campos inválidos
 */
export const validateAllVisibleRequiredFields = (
  fields: ContractField[],
  formValues: Record<string, string>,
  partiesData: PartyData[],
  repeatableFieldsData: RepeatableFieldResponse[]
): ValidationResult => {
  const invalidFieldIds = new Set<string>();
  const invalidRepeatableFields = new Map<string, Set<string>>();
  
  // 1. Validar campos NÃO-REPETÍVEIS
  const visibleNonRepeatableFields = getNonRepeatableVisibleFields(fields, formValues);
  const requiredNonRepeatableFields = visibleNonRepeatableFields.filter(f => f.required === true);
  
  requiredNonRepeatableFields.forEach(field => {
    const value = formValues[field.id];
    const isEmpty = !value || value.trim() === '';
    
    if (isEmpty) {
      invalidFieldIds.add(field.id);
      console.log(`[VALIDATION] Campo não-repetível obrigatório vazio: ${field.id}`);
    }
  });
  
  // 2. Validar campos REPETÍVEIS (por parte)
  const visibleRepeatableFields = getRepeatableVisibleFields(fields, formValues);
  const requiredRepeatableFields = visibleRepeatableFields.filter(f => f.required === true);
  
  requiredRepeatableFields.forEach(field => {
    const fieldData = repeatableFieldsData.find(f => f.fieldId === field.id);
    
    partiesData.forEach(party => {
      // Buscar resposta da parte específica
      const response = fieldData?.responses?.find(r => r.partyId === party.id);
      const value = response?.value || '';
      const isEmpty = !value || value.trim() === '';
      
      if (isEmpty) {
        if (!invalidRepeatableFields.has(field.id)) {
          invalidRepeatableFields.set(field.id, new Set());
        }
        invalidRepeatableFields.get(field.id)!.add(party.id);
        console.log(`[VALIDATION] Campo repetível obrigatório vazio: ${field.id} (parte: ${party.fullName})`);
      }
    });
  });
  
  const isValid = invalidFieldIds.size === 0 && invalidRepeatableFields.size === 0;
  
  console.log(`[VALIDATION] Resultado: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'} | Campos inválidos: ${invalidFieldIds.size} não-repetíveis, ${invalidRepeatableFields.size} repetíveis`);
  
  return {
    isValid,
    invalidFieldIds,
    invalidRepeatableFields
  };
};
