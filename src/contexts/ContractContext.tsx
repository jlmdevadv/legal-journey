import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ContractTemplate } from '../data/contractTemplates';

interface ContractContextType {
  selectedTemplate: ContractTemplate | null;
  formValues: Record<string, string>;
  currentQuestionIndex: number;
  isQuestionnaireMode: boolean;
  isAdminMode: boolean;
  isAdminLoggedIn: boolean;
  customTemplates: ContractTemplate[];
  editingTemplate: ContractTemplate | null;
  selectTemplate: (template: ContractTemplate) => void;
  updateFormValue: (fieldId: string, value: string) => void;
  resetForm: () => void;
  fillContractTemplate: () => string;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  startQuestionnaire: () => void;
  finishQuestionnaire: () => void;
  loginAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;
  toggleAdminMode: () => void;
  addCustomTemplate: (template: ContractTemplate) => void;
  updateCustomTemplate: (id: string, template: ContractTemplate) => void;
  deleteCustomTemplate: (id: string) => void;
  startEditingTemplate: (template: ContractTemplate) => void;
  finishEditingTemplate: () => void;
  saveEditingTemplate: (template: ContractTemplate) => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [isQuestionnaireMode, setIsQuestionnaireMode] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('admin_logged_in') === 'true';
  });
  const [customTemplates, setCustomTemplates] = useState<ContractTemplate[]>(() => {
    const saved = localStorage.getItem('custom_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);

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

  // Admin functions
  const loginAdmin = (username: string, password: string): boolean => {
    if (username === 'Administrador' && password === '123456') {
      setIsAdminLoggedIn(true);
      localStorage.setItem('admin_logged_in', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setIsAdminMode(false);
    localStorage.removeItem('admin_logged_in');
  };

  const toggleAdminMode = () => {
    setIsAdminMode(prev => !prev);
  };

  const addCustomTemplate = (template: ContractTemplate) => {
    console.log('Adding custom template:', template);
    const newTemplates = [...customTemplates, template];
    setCustomTemplates(newTemplates);
    localStorage.setItem('custom_templates', JSON.stringify(newTemplates));
    console.log('Custom templates after add:', newTemplates);
  };

  const updateCustomTemplate = (id: string, template: ContractTemplate) => {
    console.log('Updating custom template:', id, template);
    const newTemplates = customTemplates.map(t => t.id === id ? template : t);
    setCustomTemplates(newTemplates);
    localStorage.setItem('custom_templates', JSON.stringify(newTemplates));
    console.log('Custom templates after update:', newTemplates);
  };

  const deleteCustomTemplate = (id: string) => {
    const newTemplates = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(newTemplates);
    localStorage.setItem('custom_templates', JSON.stringify(newTemplates));
  };

  // Template editing functions
  const startEditingTemplate = (template: ContractTemplate) => {
    console.log('Starting to edit template:', template);
    setEditingTemplate(template);
  };

  const finishEditingTemplate = () => {
    console.log('Finishing template editing');
    setEditingTemplate(null);
  };

  const saveEditingTemplate = (template: ContractTemplate) => {
    console.log('Saving edited template:', template);
    
    // Check if this is an existing custom template or a new one
    const existingTemplateIndex = customTemplates.findIndex(t => t.id === template.id);
    
    if (existingTemplateIndex !== -1) {
      // Update existing template
      console.log('Updating existing template');
      updateCustomTemplate(template.id, template);
    } else {
      // Add as new template  
      console.log('Adding new template');
      addCustomTemplate(template);
    }
    
    // Clear editing state
    setEditingTemplate(null);
    console.log('Template saved successfully');
  };

  return (
    <ContractContext.Provider
      value={{
        selectedTemplate,
        formValues,
        currentQuestionIndex,
        isQuestionnaireMode,
        isAdminMode,
        isAdminLoggedIn,
        customTemplates,
        editingTemplate,
        selectTemplate,
        updateFormValue,
        resetForm,
        fillContractTemplate,
        nextQuestion,
        previousQuestion,
        goToQuestion,
        startQuestionnaire,
        finishQuestionnaire,
        loginAdmin,
        logoutAdmin,
        toggleAdminMode,
        addCustomTemplate,
        updateCustomTemplate,
        deleteCustomTemplate,
        startEditingTemplate,
        finishEditingTemplate,
        saveEditingTemplate,
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
