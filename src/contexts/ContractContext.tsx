
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ContractTemplate } from '../data/contractTemplates';

interface ContractContextType {
  selectedTemplate: ContractTemplate | null;
  formValues: Record<string, string>;
  currentQuestionIndex: number;
  isQuestionnaireMode: boolean;
  selectTemplate: (template: ContractTemplate) => void;
  updateFormValue: (fieldId: string, value: string) => void;
  resetForm: () => void;
  fillContractTemplate: () => string;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  startQuestionnaire: () => void;
  finishQuestionnaire: () => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 = welcome screen
  const [isQuestionnaireMode, setIsQuestionnaireMode] = useState(false);

  const selectTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    // Initialize form values with empty strings for each field
    const initialValues: Record<string, string> = {};
    template.fields.forEach(field => {
      initialValues[field.id] = '';
    });
    setFormValues(initialValues);
    setCurrentQuestionIndex(-1);
    setIsQuestionnaireMode(false);
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
    setCurrentQuestionIndex(-1);
    setIsQuestionnaireMode(false);
  };

  const startQuestionnaire = () => {
    setIsQuestionnaireMode(true);
    setCurrentQuestionIndex(0);
  };

  const finishQuestionnaire = () => {
    setIsQuestionnaireMode(false);
    setCurrentQuestionIndex(-1);
  };

  const nextQuestion = () => {
    if (selectedTemplate && currentQuestionIndex < selectedTemplate.fields.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (selectedTemplate && currentQuestionIndex === selectedTemplate.fields.length - 1) {
      // Go to summary screen
      setCurrentQuestionIndex(selectedTemplate.fields.length);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentQuestionIndex === 0) {
      setCurrentQuestionIndex(-1); // Back to welcome
    }
  };

  const goToQuestion = (index: number) => {
    if (selectedTemplate && index >= -1 && index <= selectedTemplate.fields.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const fillContractTemplate = (): string => {
    if (!selectedTemplate) return '';
    
    let filledTemplate = selectedTemplate.template;
    
    // Replace all field placeholders with their values
    Object.entries(formValues).forEach(([fieldId, value]) => {
      // Escape special regex characters in fieldId to use as literal string
      const escapedFieldId = fieldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const placeholderPattern = new RegExp(`\\[${escapedFieldId}\\]`, 'g');
      filledTemplate = filledTemplate.replace(placeholderPattern, value || `[${fieldId}]`);
    });
    
    return filledTemplate;
  };

  return (
    <ContractContext.Provider
      value={{
        selectedTemplate,
        formValues,
        currentQuestionIndex,
        isQuestionnaireMode,
        selectTemplate,
        updateFormValue,
        resetForm,
        fillContractTemplate,
        nextQuestion,
        previousQuestion,
        goToQuestion,
        startQuestionnaire,
        finishQuestionnaire,
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
