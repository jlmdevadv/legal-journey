import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ContractTemplate as DataContractTemplate } from '../data/contractTemplates';
import { PartyData, ContractField, RepeatableFieldResponse, ContractTemplate } from '../types/template';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getVisibleFields, getRepeatableFields } from '@/utils/conditionalLogic';

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
  isLoadingTemplates: boolean;
  editingTemplate: ContractTemplate | null;
  numberOfParties: number;
  partiesData: PartyData[];
  currentPartyIndex: number;
  numberOfOtherParties: number;
  otherPartiesData: PartyData[];
  partyTypes: any[];
  locationData: LocationData;
  repeatableFieldsData: RepeatableFieldResponse[];
  selectTemplate: (template: ContractTemplate) => void;
  updateFormValue: (fieldId: string, value: string) => void;
  resetForm: () => void;
  fillContractTemplate: () => string;
  nextQuestion: (option?: string) => void;
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
  setNumberOfOtherParties: (count: number) => void;
  updatePartyData: (index: number, data: PartyData, isOther?: boolean) => void;
  addPartyType: (typeData: any) => Promise<void>;
  getContractingParties: () => string;
  getOtherInvolved: () => string;
  getSignatures: () => string;
  updateLocationData: (field: string, value: string) => void;
  getLocationDate: () => string;
  updateRepeatableFieldValue: (fieldId: string, partyId: string, value: string) => void;
  getRepeatableFieldValue: (fieldId: string, partyId: string) => string;
  getRepeatableFieldFormattedText: (fieldId: string) => string;
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
  const [numberOfOtherParties, setNumberOfOtherPartiesState] = useState<number>(0);
  const [otherPartiesData, setOtherPartiesData] = useState<PartyData[]>([]);
  const [partyTypes, setPartyTypes] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<LocationData>({
    city: '',
    state: '',
    date: ''
  });
  const [repeatableFieldsData, setRepeatableFieldsData] = useState<RepeatableFieldResponse[]>([]);

  // Load templates and party types from Supabase on mount
  useEffect(() => {
    loadTemplatesFromSupabase();
    loadPartyTypes();
  }, []);

  const loadPartyTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('party_types')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      
      setPartyTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de partes:', error);
      toast.error('Erro ao carregar tipos de partes');
    }
  };

  const loadTemplatesFromSupabase = async () => {
    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const templates = data.map(t => ({
          ...t,
          fields: t.fields as any as ContractField[],
          version: t.version as any
        })) as ContractTemplate[];
        
        setCustomTemplates(templates);
        console.log(`✅ Carregados ${templates.length} templates do banco`);
      } else {
        // Se banco vazio, fazer seed automático
        console.log('📦 Banco vazio, executando seed...');
        const { seedDefaultTemplates } = await import('@/utils/seedDefaultTemplates');
        await seedDefaultTemplates();
        // Recarregar após seed
        await loadTemplatesFromSupabase();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates do banco');
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
    setRepeatableFieldsData([]);
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
    setRepeatableFieldsData([]);
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

  const nextQuestion = (option?: string) => {
    if (currentQuestionIndex === -2) {
      // From party number question to first party data
      if (numberOfParties > 0) {
        setCurrentQuestionIndex(-1000);
      }
    } else if (currentQuestionIndex >= -1000 && currentQuestionIndex < -1000 + numberOfParties - 1) {
      // Move to next main party
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentQuestionIndex === -1000 + numberOfParties - 1) {
      // From last main party to "other parties" question
      setCurrentQuestionIndex(-4);
    } else if (currentQuestionIndex === -4) {
      // From "other parties" question
      if (option === 'withOtherParties') {
        setCurrentQuestionIndex(-5); // Go to number question
      } else {
        // Check if there are repeatable fields
        if (selectedTemplate) {
          const repeatableFields = getRepeatableFields(selectedTemplate.fields);
          if (repeatableFields.length > 0 && numberOfParties > 0) {
            setCurrentQuestionIndex(-3000); // Go to first repeatable field
          } else {
            setCurrentQuestionIndex(-3); // Skip to location/date
          }
        } else {
          setCurrentQuestionIndex(-3);
        }
      }
    } else if (currentQuestionIndex === -5) {
      // From other parties number to first other party data
      if (numberOfOtherParties > 0) {
        setCurrentQuestionIndex(-2000);
      }
    } else if (currentQuestionIndex >= -2000 && currentQuestionIndex < -2000 + numberOfOtherParties - 1) {
      // Move to next other party
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentQuestionIndex === -2000 + numberOfOtherParties - 1) {
      // From last other party to repeatable fields (if any)
      if (selectedTemplate) {
        const repeatableFields = getRepeatableFields(selectedTemplate.fields);
        if (repeatableFields.length > 0 && numberOfParties > 0) {
          setCurrentQuestionIndex(-3000);
        } else {
          setCurrentQuestionIndex(-3);
        }
      } else {
        setCurrentQuestionIndex(-3);
      }
    } else if (currentQuestionIndex >= -3000) {
      // Navigating through repeatable fields
      if (selectedTemplate) {
        const repeatableFields = getRepeatableFields(selectedTemplate.fields);
        const totalRepeatableSteps = numberOfParties * repeatableFields.length;
        const repeatableIndex = currentQuestionIndex + 3000;
        
        if (repeatableIndex < totalRepeatableSteps - 1) {
          // Next repeatable field
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // Finished repeatable fields, go to location/date
          setCurrentQuestionIndex(-3);
        }
      } else {
        setCurrentQuestionIndex(-3);
      }
    } else if (currentQuestionIndex === -3) {
      // From location/date to first non-repeatable template question
      if (selectedTemplate) {
        const nonRepeatableFields = selectedTemplate.fields.filter(f => !f.repeatPerParty);
        const visibleFields = getVisibleFields(nonRepeatableFields, formValues);
        if (visibleFields.length > 0) {
          setCurrentQuestionIndex(-1000 + numberOfParties);
        } else {
          // No visible fields, go to summary
          setCurrentQuestionIndex(-1000 + numberOfParties);
        }
      }
    } else if (selectedTemplate) {
      const nonRepeatableFields = selectedTemplate.fields.filter(f => !f.repeatPerParty);
      const visibleFields = getVisibleFields(nonRepeatableFields, formValues);
      const templateQuestionIndex = currentQuestionIndex + 1000 - numberOfParties;
      if (templateQuestionIndex < visibleFields.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (templateQuestionIndex === visibleFields.length - 1) {
        // Go to summary screen
        setCurrentQuestionIndex(-1000 + numberOfParties + visibleFields.length);
      }
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex === -2) {
      // From party number back to welcome
      setCurrentQuestionIndex(-1);
    } else if (currentQuestionIndex === -1000) {
      // From first main party back to party number
      setCurrentQuestionIndex(-2);
    } else if (currentQuestionIndex > -1000 && currentQuestionIndex < -1000 + numberOfParties) {
      // Move to previous main party
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentQuestionIndex === -4) {
      // From "other parties" question back to last main party
      if (numberOfParties > 0) {
        setCurrentQuestionIndex(-1000 + numberOfParties - 1);
      }
    } else if (currentQuestionIndex === -5) {
      // From other parties number back to "other parties" question
      setCurrentQuestionIndex(-4);
    } else if (currentQuestionIndex === -2000) {
      // From first other party back to number question
      setCurrentQuestionIndex(-5);
    } else if (currentQuestionIndex > -2000 && currentQuestionIndex < -2000 + numberOfOtherParties) {
      // Move to previous other party
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentQuestionIndex === -3000) {
      // From first repeatable field back to previous section
      if (numberOfOtherParties > 0) {
        // Back to last other party
        setCurrentQuestionIndex(-2000 + numberOfOtherParties - 1);
      } else {
        // Back to "other parties" question
        setCurrentQuestionIndex(-4);
      }
    } else if (currentQuestionIndex > -3000 && currentQuestionIndex < -3000 + (selectedTemplate ? numberOfParties * getRepeatableFields(selectedTemplate.fields).length : 0)) {
      // Navigate back through repeatable fields
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentQuestionIndex === -3) {
      // From location/date back
      if (selectedTemplate) {
        const repeatableFields = getRepeatableFields(selectedTemplate.fields);
        if (repeatableFields.length > 0 && numberOfParties > 0) {
          // Back to last repeatable field
          const lastRepeatableIndex = -3000 + (numberOfParties * repeatableFields.length) - 1;
          setCurrentQuestionIndex(lastRepeatableIndex);
        } else if (numberOfOtherParties > 0) {
          // Back to last other party
          setCurrentQuestionIndex(-2000 + numberOfOtherParties - 1);
        } else {
          // Back to "other parties" question
          setCurrentQuestionIndex(-4);
        }
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

  // Funções para campos repetíveis
  const updateRepeatableFieldValue = (fieldId: string, partyId: string, value: string) => {
    setRepeatableFieldsData(prev => {
      const existingFieldIndex = prev.findIndex(f => f.fieldId === fieldId);
      
      if (existingFieldIndex === -1) {
        // Campo ainda não existe, criar novo
        const party = partiesData.find(p => p.id === partyId);
        return [...prev, {
          fieldId,
          responses: [{
            partyId,
            partyName: party?.fullName || '',
            value
          }]
        }];
      } else {
        // Campo existe, atualizar ou adicionar resposta da parte
        const updated = [...prev];
        const field = { ...updated[existingFieldIndex] };
        const responseIndex = field.responses.findIndex(r => r.partyId === partyId);
        
        if (responseIndex === -1) {
          // Parte ainda não respondeu, adicionar
          const party = partiesData.find(p => p.id === partyId);
          field.responses.push({
            partyId,
            partyName: party?.fullName || '',
            value
          });
        } else {
          // Atualizar resposta existente
          field.responses[responseIndex].value = value;
        }
        
        updated[existingFieldIndex] = field;
        return updated;
      }
    });
  };

  const getRepeatableFieldValue = (fieldId: string, partyId: string): string => {
    const field = repeatableFieldsData.find(f => f.fieldId === fieldId);
    if (!field) return '';
    
    const response = field.responses.find(r => r.partyId === partyId);
    return response?.value || '';
  };

  const getRepeatableFieldFormattedText = (fieldId: string): string => {
    const field = repeatableFieldsData.find(f => f.fieldId === fieldId);
    if (!field || field.responses.length === 0) return `[${fieldId}]`;
    
    // Formatar: "Nome da Parte: Resposta\n"
    return field.responses
      .filter(r => r.value.trim() !== '') // Ignorar respostas vazias
      .map(r => `${r.partyName}: ${r.value}`)
      .join('\n');
  };

  const fillContractTemplate = (): string => {
    if (!selectedTemplate) return '';
    
    let filledTemplate = selectedTemplate.template;
    
    // 1. Replace campos repetíveis PRIMEIRO
    if (selectedTemplate.fields) {
      selectedTemplate.fields
        .filter(field => field.repeatPerParty === true)
        .forEach(field => {
          const formattedText = getRepeatableFieldFormattedText(field.id);
          const escapedFieldId = field.id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const placeholderPattern = new RegExp(`\\[${escapedFieldId}\\]`, 'g');
          filledTemplate = filledTemplate.replace(placeholderPattern, formattedText);
        });
    }
    
    // 2. Replace campos normais
    Object.entries(formValues).forEach(([fieldId, value]) => {
      // Escape special regex characters in fieldId to use as literal string
      const escapedFieldId = fieldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const placeholderPattern = new RegExp(`\\[${escapedFieldId}\\]`, 'g');
      filledTemplate = filledTemplate.replace(placeholderPattern, value || `[${fieldId}]`);
    });
    
    // 3. Replace location and date placeholders (automatic system fields)
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
      // Converter camelCase para snake_case para o Supabase
      const supabaseTemplate = {
        ...templateWithVersion,
        use_party_system: templateWithVersion.usePartySystem,
      };
      delete (supabaseTemplate as any).usePartySystem;
      
      const { data, error } = await supabase
        .from('contract_templates')
        .insert([supabaseTemplate as any])
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
      partyType: 'Contratante',
      category: 'main' as const
    }));
    setPartiesData(initialParties);
    setCurrentPartyIndex(0);
  };

  const handleSetNumberOfOtherParties = (count: number) => {
    setNumberOfOtherPartiesState(count);
    // Initialize empty other party data array
    const initialOtherParties: PartyData[] = Array.from({ length: count }, (_, index) => ({
      id: `other-party-${index}`,
      fullName: '',
      nationality: '',
      maritalStatus: '',
      cpf: '',
      address: '',
      city: '',
      state: '',
      partyType: 'Testemunha',
      category: 'other' as const
    }));
    setOtherPartiesData(initialOtherParties);
  };

  const updatePartyData = (index: number, data: PartyData, isOther: boolean = false) => {
    if (isOther) {
      setOtherPartiesData(prev => {
        const updated = [...prev];
        updated[index] = data;
        return updated;
      });
    } else {
      setPartiesData(prev => {
        const updated = [...prev];
        updated[index] = data;
        return updated;
      });
    }
  };

  const addPartyType = async (typeData: any) => {
    try {
      const maxOrder = Math.max(...partyTypes.map((t: any) => t.display_order), 0);
      
      const { data, error } = await supabase
        .from('party_types')
        .insert([{
          name: typeData.name,
          category: typeData.category,
          description: typeData.description,
          is_default: false,
          display_order: maxOrder + 1
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setPartyTypes([...partyTypes, data]);
      toast.success(`Tipo "${data.name}" adicionado com sucesso!`);
    } catch (error) {
      console.error('Erro ao adicionar tipo de parte:', error);
      toast.error('Erro ao adicionar tipo de parte');
    }
  };

  const formatPartyQualification = (party: PartyData): string => {
    return `**${party.fullName.toUpperCase()}**, ${party.nationality}, ${party.maritalStatus}, inscrito(a) no CPF sob o nº ${party.cpf}, residente e domiciliado(a) na ${party.address}, ${party.city}, ${party.state}, na qualidade de **${party.partyType.toUpperCase()}**.`;
  };

  const getContractingParties = (): string => {
    if (partiesData.length === 0) return '';
    
    const qualifications = partiesData.map(formatPartyQualification);
    return qualifications.join('\n\n');
  };

  const getOtherInvolved = (): string => {
    if (otherPartiesData.length === 0) return '';
    
    const qualifications = otherPartiesData.map(formatPartyQualification);
    return '\n\nE AINDA:\n\n' + qualifications.join('\n\n');
  };

  const formatSignatureBlock = (party: PartyData): string => {
    return `_________________________\n${party.fullName}\nCPF: ${party.cpf}\n${party.partyType}`;
  };

  const getSignatures = (): string => {
    const allParties = [...partiesData, ...otherPartiesData];
    if (allParties.length === 0) return '';
    
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
        isLoadingTemplates,
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
        numberOfOtherParties,
        otherPartiesData,
        partyTypes,
        setNumberOfParties: handleSetNumberOfParties,
        setNumberOfOtherParties: handleSetNumberOfOtherParties,
        updatePartyData,
        addPartyType,
        getContractingParties,
        getOtherInvolved,
        getSignatures,
        locationData,
        updateLocationData: updateLocationDataFunc,
        getLocationDate,
        repeatableFieldsData,
        updateRepeatableFieldValue,
        getRepeatableFieldValue,
        getRepeatableFieldFormattedText,
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
