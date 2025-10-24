import { ContractTemplate } from '@/types/template';
import { TemplateImportJSON } from './templateImporter';
import { sanitizeVariableName } from './templateUtils';

export const exportTemplateToJSON = (template: ContractTemplate): string => {
  // Converter [field-id] de volta para {{field_id}} no texto
  let contractText = template.template;
  
  template.fields.forEach(field => {
    const regex = new RegExp(`\\[${field.id}\\]`, 'g');
    contractText = contractText.replace(regex, `{{${field.id}}}`);
  });
  
  const exportData: TemplateImportJSON = {
    templateName: template.name,
    templateDescription: template.description,
    contractText: contractText,
    cards: template.fields.map(field => ({
      id: field.id,
      title: field.label,
      type: field.type,
      placeholder: field.placeholder,
      required: field.required,
      options: field.options,
      helpText: {
        how: field.howToFill || '',
        why: field.whyImportant || ''
      },
      videoLink: field.videoLink,
      aiAssistantLink: field.aiAssistantLink,
      conditionalLogic: field.conditionalLogic
    })),
    usePartySystem: template.usePartySystem
  };
  
  // Remover campos vazios/undefined para JSON mais limpo
  const cleanedData = JSON.parse(JSON.stringify(exportData, (key, value) => {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return undefined;
    }
    return value;
  }));
  
  return JSON.stringify(cleanedData, null, 2);
};

export const downloadTemplateJSON = (template: ContractTemplate) => {
  const jsonString = exportTemplateToJSON(template);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Sanitizar nome do arquivo
  const fileName = template.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  link.download = `${fileName}_template.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
