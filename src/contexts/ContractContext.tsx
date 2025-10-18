import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ContractTemplate } from '../data/contractTemplates';
import { PartyData, ContractField } from '../types/template';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  city: string;
  state: string;
  date: string;
}

interface ContractContextType {
  selectedTemplate: ContractTemplate | null;
  formValues: Record<string, string>;
  currentQuestionIndex: number;
  isQuestionnaireMode: boolean;
  isAdminMode: boolean;
  isAdminLoggedIn: boolean;
  customTemplates: ContractTemplate[];
  editingTemplate: ContractTemplate | null;
  numberOfParties: number;
  partiesData: PartyData[];
  currentPartyIndex: number;
  locationData: LocationData;
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
  setNumberOfParties: (count: number) => void;
  updatePartyData: (index: number, data: PartyData) => void;
  getContractingParties: () => string;
  getOtherInvolved: () => string;
  getSignatures: () => string;
  updateLocationData: (field: string, value: string) => void;
  getLocationDate: () => string;
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
  const [customTemplates, setCustomTemplates] = useState<ContractTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [numberOfParties, setNumberOfParties] = useState<number>(0);
  const [partiesData, setPartiesData] = useState<PartyData[]>([]);
  const [currentPartyIndex, setCurrentPartyIndex] = useState<number>(0);
  const [locationData, setLocationData] = useState<LocationData>({
    city: '',
    state: '',
    date: ''
  });

  // Load templates from Supabase on mount
  useEffect(() => {
    loadTemplatesFromSupabase();
  }, []);

  const loadTemplatesFromSupabase = async () => {
    try {
      setIsLoadingTemplates(true);
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Convert Supabase data to ContractTemplate format
        const templates = data.map(item => ({
          ...item,
          fields: item.fields as any as ContractField[],
          version: item.version as any
        })) as ContractTemplate[];
        setCustomTemplates(templates);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates do banco de dados');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Migrate localStorage data to Supabase (run once)
  const migrateLocalStorageToSupabase = async () => {
    const stored = localStorage.getItem('customTemplates');
    if (!stored) return;

    try {
      const localTemplates = JSON.parse(stored);
      if (localTemplates.length === 0) return;

      const { error } = await supabase
        .from('contract_templates')
        .insert(localTemplates);
      
      if (error) throw error;

      localStorage.removeItem('customTemplates');
      toast.success('Templates migrados com sucesso!');
      loadTemplatesFromSupabase();
    } catch (error) {
      console.error('Erro ao migrar templates:', error);
      toast.error('Erro ao migrar templates');
    }
  };

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
    // Reset party data
    setNumberOfParties(0);
    setPartiesData([]);
    setCurrentPartyIndex(0);
    setLocationData({ city: '', state: '', date: '' });
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
    setNumberOfParties(0);
    setPartiesData([]);
    setCurrentPartyIndex(0);
    setLocationData({ city: '', state: '', date: '' });
  };

  const startQuestionnaire = () => {
    setIsQuestionnaireMode(true);
    // For now, always use party system - start with party number question
    setCurrentQuestionIndex(-2); // -2 for party number question
  };

  const finishQuestionnaire = () => {
    setIsQuestionnaireMode(false);
    setCurrentQuestionIndex(-1);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex === -2) {
      // From party number question to first party data
      if (numberOfParties > 0) {
        setCurrentQuestionIndex(-1000);
      }
    } else if (currentQuestionIndex >= -1000 && currentQuestionIndex < -1000 + numberOfParties - 1) {
      // Move to next party
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentQuestionIndex === -1000 + numberOfParties - 1) {
      // From last party to location/date question
      setCurrentQuestionIndex(-3);
    } else if (currentQuestionIndex === -3) {
      // From location/date to first template question or summary
      if (selectedTemplate && selectedTemplate.fields.length > 0) {
        setCurrentQuestionIndex(-1000 + numberOfParties);
      } else {
        // No template questions, go to summary
        setCurrentQuestionIndex(-1000 + numberOfParties + (selectedTemplate?.fields.length || 0));
      }
    } else if (selectedTemplate) {
      const templateQuestionIndex = currentQuestionIndex + 1000 - numberOfParties;
      if (templateQuestionIndex < selectedTemplate.fields.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (templateQuestionIndex === selectedTemplate.fields.length - 1) {
        // Go to summary screen
        setCurrentQuestionIndex(-1000 + numberOfParties + selectedTemplate.fields.length);
      }
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex === -2) {
      // From party number back to welcome
      setCurrentQuestionIndex(-1);
    } else if (currentQuestionIndex === -1000) {
      // From first party back to party number
      setCurrentQuestionIndex(-2);
    } else if (currentQuestionIndex > -1000 && currentQuestionIndex < -1000 + numberOfParties) {
      // Move to previous party
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentQuestionIndex === -3) {
      // From location/date back to last party
      if (numberOfParties > 0) {
        setCurrentQuestionIndex(-1000 + numberOfParties - 1);
      }
    } else if (currentQuestionIndex === -1000 + numberOfParties) {
      // From first template question back to location/date
      setCurrentQuestionIndex(-3);
    } else if (currentQuestionIndex > -1000 + numberOfParties) {
      // Navigate through template questions
      setCurrentQuestionIndex(prev => prev - 1);
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
    
    // Replace location and date placeholders (automatic system fields)
    filledTemplate = filledTemplate.replace(/\[city\]/g, locationData.city || '[city]');
    filledTemplate = filledTemplate.replace(/\[state\]/g, locationData.state || '[state]');
    filledTemplate = filledTemplate.replace(/\[signing-date\]/g, locationData.date ? formatDateToBrazilian(locationData.date) : '[signing-date]');
    
    return filledTemplate;
  };

  const formatDateToBrazilian = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
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

  const addCustomTemplate = async (template: ContractTemplate) => {
    console.log('Adding custom template:', template);
    const templateWithVersion = initializeTemplateVersion(template);
    
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .insert([templateWithVersion as any])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newTemplate = {
          ...data[0],
          fields: data[0].fields as any as ContractField[],
          version: data[0].version as any
        } as ContractTemplate;
        setCustomTemplates(prev => [...prev, newTemplate]);
        toast.success('Template adicionado com sucesso!');
        console.log('Custom templates after add:', newTemplate);
      }
    } catch (error) {
      console.error('Erro ao adicionar template:', error);
      toast.error('Erro ao adicionar template');
    }
  };

  const updateCustomTemplate = async (id: string, template: ContractTemplate) => {
    console.log('Updating custom template:', id, template);
    const templateWithVersion = updateTemplateVersion(template);
    
    try {
      const { error } = await supabase
        .from('contract_templates')
        .update(templateWithVersion as any)
        .eq('id', id);
      
      if (error) throw error;
      
      setCustomTemplates(prev => 
        prev.map(t => t.id === id ? templateWithVersion : t)
      );
      toast.success('Template atualizado com sucesso!');
      console.log('Custom templates after update');
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
    }
  };

  const deleteCustomTemplate = async (id: string) => {
    console.log('Deleting custom template:', id);
    
    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deletado com sucesso!');
      console.log('Custom templates after delete');
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      toast.error('Erro ao deletar template');
    }
  };

  const startEditingTemplate = (template: ContractTemplate) => {
    console.log('Starting to edit template:', template);
    const templateWithVersion = initializeTemplateVersion(template);
    setEditingTemplate(templateWithVersion);
  };

  const finishEditingTemplate = () => {
    console.log('Finishing template editing');
    setEditingTemplate(null);
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

  // Party system functions
  const handleSetNumberOfParties = (count: number) => {
    setNumberOfParties(count);
    // Initialize empty party data array
    const initialParties: PartyData[] = Array.from({ length: count }, (_, index) => ({
      id: `party-${index}`,
      fullName: '',
      nationality: '',
      maritalStatus: '',
      cpf: '',
      address: '',
      city: '',
      state: '',
      partyType: 'Contratante'
    }));
    setPartiesData(initialParties);
    setCurrentPartyIndex(0);
  };

  const updatePartyData = (index: number, data: PartyData) => {
    setPartiesData(prev => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  };

  const formatPartyQualification = (party: PartyData): string => {
    return `${party.fullName}, ${party.nationality}, ${party.maritalStatus}, inscrito(a) no CPF sob o nº ${party.cpf}, residente e domiciliado(a) na ${party.address}, ${party.city}, ${party.state}.`;
  };

  const getContractingParties = (): string => {
    const contractingParties = partiesData.filter(party => party.partyType === 'Contratante');
    if (contractingParties.length === 0) return '';
    
    const qualifications = contractingParties.map(formatPartyQualification);
    return qualifications.join('\n\n');
  };

  const getOtherInvolved = (): string => {
    const otherParties = partiesData.filter(party => party.partyType !== 'Contratante');
    if (otherParties.length === 0) return '';
    
    const qualifications = otherParties.map(formatPartyQualification);
    return qualifications.join('\n\n');
  };

  const formatSignatureBlock = (party: PartyData): string => {
    return `_________________________\n${party.fullName}\nCPF: ${party.cpf}\n${party.partyType}`;
  };

  const getSignatures = (): string => {
    if (partiesData.length === 0) return '';
    
    // First contratantes, then others
    const contractingParties = partiesData.filter(party => party.partyType === 'Contratante');
    const otherParties = partiesData.filter(party => party.partyType !== 'Contratante');
    
    const allParties = [...contractingParties, ...otherParties];
    const signatures = allParties.map(formatSignatureBlock);
    
    return signatures.join('\n\n');
  };

  const updateLocationDataFunc = (field: string, value: string) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getLocationDate = (): string => {
    if (!locationData.city || !locationData.state || !locationData.date) return '';
    
    const formattedDate = formatDateToBrazilian(locationData.date);
    return `${locationData.city}, ${locationData.state}, ${formattedDate}`;
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
        numberOfParties,
        partiesData,
        currentPartyIndex,
        setNumberOfParties: handleSetNumberOfParties,
        updatePartyData,
        getContractingParties,
        getOtherInvolved,
        getSignatures,
        locationData,
        updateLocationData: updateLocationDataFunc,
        getLocationDate,
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
