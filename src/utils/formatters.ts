/**
 * Utilitários de formatação para documentos (CPF/CNPJ)
 * @version 3.2
 */

/**
 * Formata CPF: 000.000.000-00
 */
export const formatCPF = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
};

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export const formatCNPJ = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 14);
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
};

/**
 * Formata documento automaticamente baseado no tipo de pessoa
 */
export const formatDocument = (value: string, personType: 'PF' | 'PJ'): string => {
  return personType === 'PJ' ? formatCNPJ(value) : formatCPF(value);
};

/**
 * Validação básica de CPF (apenas formato, não verifica dígitos)
 */
export const isValidCPFFormat = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.length === 11;
};

/**
 * Validação básica de CNPJ (apenas formato, não verifica dígitos)
 */
export const isValidCNPJFormat = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.length === 14;
};

/**
 * Retorna o tamanho máximo do campo de documento
 */
export const getDocumentMaxLength = (personType: 'PF' | 'PJ'): number => {
  return personType === 'PJ' ? 18 : 14; // CNPJ formatado: 18 chars, CPF formatado: 14 chars
};

/**
 * Retorna placeholder apropriado para o documento
 */
export const getDocumentPlaceholder = (personType: 'PF' | 'PJ'): string => {
  return personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00';
};
