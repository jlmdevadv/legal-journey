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
  
  // 🔍 LOG DETALHADO: Mostrar TODOS os campos visíveis
  console.log('[VALIDATION-DEBUG] Campos não-repetíveis visíveis:', 
    visibleNonRepeatableFields.map(f => ({ 
      id: f.id, 
      label: f.label, 
      required: f.required,
      value: formValues[f.id]
    }))
  );
  
  console.log('[VALIDATION-DEBUG] Campos não-repetíveis OBRIGATÓRIOS:', 
    requiredNonRepeatableFields.map(f => ({ 
      id: f.id, 
      label: f.label,
      value: formValues[f.id],
      isEmpty: !formValues[f.id] || formValues[f.id].trim() === ''
    }))
  );
  
  requiredNonRepeatableFields.forEach(field => {
    const value = formValues[field.id];
    const isEmpty = !value || value.trim() === '';
    
    if (isEmpty) {
      invalidFieldIds.add(field.id);
      console.log(`[VALIDATION] ❌ Campo não-repetível obrigatório vazio: ${field.id} (${field.label})`);
    } else {
      console.log(`[VALIDATION] ✅ Campo não-repetível obrigatório preenchido: ${field.id} (${field.label})`);
    }
  });
  
  // 2. Validar campos REPETÍVEIS (por parte)
  const visibleRepeatableFields = getRepeatableVisibleFields(fields, formValues);
  const requiredRepeatableFields = visibleRepeatableFields.filter(f => f.required === true);
  
  // 🔍 LOG DETALHADO: Mostrar campos repetíveis
  console.log('[VALIDATION-DEBUG] Campos repetíveis visíveis:', 
    visibleRepeatableFields.map(f => ({ 
      id: f.id, 
      label: f.label, 
      required: f.required
    }))
  );
  
  console.log('[VALIDATION-DEBUG] Campos repetíveis OBRIGATÓRIOS:', 
    requiredRepeatableFields.map(f => f.id)
  );
  
  requiredRepeatableFields.forEach(field => {
    const fieldData = repeatableFieldsData.find(f => f.fieldId === field.id);
    
    console.log(`[VALIDATION-DEBUG] Verificando campo repetível: ${field.id}`, {
      fieldData: fieldData,
      partiesCount: partiesData.length
    });
    
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
        console.log(`[VALIDATION] ❌ Campo repetível obrigatório vazio: ${field.id} (parte: ${party.fullName})`);
      } else {
        console.log(`[VALIDATION] ✅ Campo repetível obrigatório preenchido: ${field.id} (parte: ${party.fullName})`);
      }
    });
  });
  
  const isValid = invalidFieldIds.size === 0 && invalidRepeatableFields.size === 0;
  
  console.log(`[VALIDATION] ========== RESULTADO FINAL ==========`);
  console.log(`[VALIDATION] Status: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  console.log(`[VALIDATION] Campos não-repetíveis inválidos (${invalidFieldIds.size}):`, Array.from(invalidFieldIds));
  console.log(`[VALIDATION] Campos repetíveis inválidos (${invalidRepeatableFields.size}):`, 
    Array.from(invalidRepeatableFields.entries()).map(([fieldId, partyIds]) => ({
      fieldId,
      partyIds: Array.from(partyIds)
    }))
  );
  console.log(`[VALIDATION] =======================================`);
  
  return {
    isValid,
    invalidFieldIds,
    invalidRepeatableFields
  };
};
