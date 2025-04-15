
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ContractTemplate } from '../data/contractTemplates';

interface ContractContextType {
  selectedTemplate: ContractTemplate | null;
  formValues: Record<string, string>;
  selectTemplate: (template: ContractTemplate) => void;
  updateFormValue: (fieldId: string, value: string) => void;
  resetForm: () => void;
  fillContractTemplate: () => string;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const selectTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    // Initialize form values with empty strings for each field
    const initialValues: Record<string, string> = {};
    template.fields.forEach(field => {
      initialValues[field.id] = '';
    });
    setFormValues(initialValues);
  };

  const updateFormValue = (fieldId: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const resetForm = () => {
    setFormValues({});
    setSelectedTemplate(null);
  };

  const fillContractTemplate = (): string => {
    if (!selectedTemplate) return '';
    
    let filledTemplate = selectedTemplate.template;
    
    // Calculate end date for rental agreement if needed
    if (selectedTemplate.id === 'rent-agreement' && formValues['start-date'] && formValues['rental-period']) {
      const startDate = new Date(formValues['start-date']);
      const periodMonths = parseInt(formValues['rental-period'], 10);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + periodMonths);
      
      const formattedEndDate = endDate.toISOString().split('T')[0];
      filledTemplate = filledTemplate.replace(/\[calculated-end-date\]/g, formattedEndDate);
    }
    
    // Replace all field placeholders with their values
    Object.entries(formValues).forEach(([fieldId, value]) => {
      const placeholder = `[${fieldId}]`;
      filledTemplate = filledTemplate.replace(new RegExp(placeholder, 'g'), value || placeholder);
    });
    
    return filledTemplate;
  };

  return (
    <ContractContext.Provider
      value={{
        selectedTemplate,
        formValues,
        selectTemplate,
        updateFormValue,
        resetForm,
        fillContractTemplate,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = (): ContractContextType => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};
