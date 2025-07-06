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
  updateSelectedTemplateField: (fieldIndex: number, updatedField: any) => void;
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

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '.');
  };

  const incrementVersion = (currentVersion?: string): string => {
    if (!currentVersion || !currentVersion.includes('v.')) {
      return 'v. 1.0';
    }
    
    const versionMatch = currentVersion.match(/v\. (\d+)\.(\d+)/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);
      return `v. ${major}.${minor + 1}`;
    }
    
    return 'v. 1.1';
  };

  const initializeTemplateVersion = (template: ContractTemplate): ContractTemplate => {
    if (!template.version) {
      const today = formatDate(new Date());
      return {
        ...template,
        version: {
          version: 'v. 1.0',
          date: today,
          createdDate: today
        }
      };
    }
    return template;
  };

  const updateTemplateVersion = (template: ContractTemplate): ContractTemplate => {
    const today = formatDate(new Date());
    const currentVersion = template.version?.version || 'v. 1.0';
    const newVersion = incrementVersion(currentVersion);
    
    return {
      ...template,
      version: {
        version: newVersion,
        date: today,
        createdDate: template.version?.createdDate || today
      }
    };
  };

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
    const templateWithVersion = initializeTemplateVersion(template);
    const newTemplates = [...customTemplates, templateWithVersion];
    setCustomTemplates(newTemplates);
    localStorage.setItem('custom_templates', JSON.stringify(newTemplates));
    console.log('Custom templates after add:', newTemplates);
  };

  const updateCustomTemplate = (id: string, template: ContractTemplate) => {
    console.log('Updating custom template:', id, template);
    const templateWithVersion = updateTemplateVersion(template);
    const newTemplates = customTemplates.map(t => t.id === id ? templateWithVersion : t);
    setCustomTemplates(newTemplates);
    localStorage.setItem('custom_templates', JSON.stringify(newTemplates));
    console.log('Custom templates after update:', newTemplates);
  };

  const startEditingTemplate = (template: ContractTemplate) => {
    console.log('Starting to edit template:', template);
    const templateWithVersion = initializeTemplateVersion(template);
    setEditingTemplate(templateWithVersion);
  };

  const saveEditingTemplate = (template: ContractTemplate) => {
    console.log('Saving edited template:', template);
    
    const templateWithVersion = updateTemplateVersion(template);
    
    // Check if this template exists in custom templates
    const existingIndex = customTemplates.findIndex(t => t.id === template.id);
    
    if (existingIndex !== -1) {
      // Update existing template
      console.log('Updating existing template');
      updateCustomTemplate(template.id, templateWithVersion);
    } else {
      // Add as new template  
      console.log('Adding new template');
      addCustomTemplate(templateWithVersion);
    }
    
    // If the edited template is currently selected, update it
    if (selectedTemplate && selectedTemplate.id === template.id) {
      setSelectedTemplate(templateWithVersion);
    }
    
    // Clear editing state
    setEditingTemplate(null);
    console.log('Template saved successfully');
  };

  const updateSelectedTemplateField = (fieldIndex: number, updatedField: any) => {
    if (!selectedTemplate) return;
    
    console.log('Updating selected template field:', fieldIndex, updatedField);
    
    const updatedFields = [...selectedTemplate.fields];
    updatedFields[fieldIndex] = updatedField;
    
    const updatedTemplate = updateTemplateVersion({
      ...selectedTemplate,
      fields: updatedFields
    });

    // Update the template in the appropriate storage
    if (selectedTemplate.id.startsWith('custom-')) {
      updateCustomTemplate(selectedTemplate.id, updatedTemplate);
    } else {
      // For original templates, we now update them directly instead of creating copies
      // But since original templates come from contractTemplates.ts, we need to store them as custom
      const customTemplate = {
        ...updatedTemplate,
        id: selectedTemplate.id // Keep the same ID
      };
      
      // Check if it already exists in custom templates
      const existingIndex = customTemplates.findIndex(t => t.id === selectedTemplate.id);
      if (existingIndex !== -1) {
        updateCustomTemplate(selectedTemplate.id, customTemplate);
      } else {
        addCustomTemplate(customTemplate);
      }
    }
    
    // Update the selected template immediately
    setSelectedTemplate(updatedTemplate);
    console.log('Selected template field updated successfully');
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
        updateSelectedTemplateField,
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
