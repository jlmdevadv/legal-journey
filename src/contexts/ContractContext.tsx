import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ContractTemplate as DataContractTemplate } from '../data/contractTemplates';
import { PartyData, ContractField, RepeatableFieldResponse, ContractTemplate } from '../types/template';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getVisibleFields, getRepeatableFields, getNonRepeatableVisibleFields } from '@/utils/conditionalLogic';

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
  isEditingFromSummary: boolean;
  selectTemplate: (template: ContractTemplate) => void;
  updateFormValue: (fieldId: string, value: string) => void;
  resetForm: () => void;
  fillContractTemplate: () => string;
  nextQuestion: (option?: string) => void;
  previousQuestion: () => void;
  goToQuestion: (index: number, triggeredFromSummary?: boolean) => void;
  saveAndReturnToSummary: () => void;
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
    date: new Date().toISOString().split('T')[0]
  });
  const [repeatableFieldsData, setRepeatableFieldsData] = useState<RepeatableFieldResponse[]>([]);
  const [isEditingFromSummary, setIsEditingFromSummary] = useState(false);

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
    // ============ HELPER FUNCTION ============
    // Helper function: transição de outras partes para próximo bloco
    const transitionFromOtherPartiesToNext = () => {
      if (!selectedTemplate) return;
      
      const repeatableFields = getRepeatableFields(selectedTemplate.fields);
      if (repeatableFields.length > 0 && numberOfParties > 0) {
        setCurrentQuestionIndex(0); // → BLOCO 2: Primeira Repetível
      } else {
        setCurrentQuestionIndex(-3); // → Location/Date
      }
    };
    
    // ============ BLOCO 1: SISTEMA (Índices Negativos) ============
    
    // Welcome (-1) → Party Number (-2)
    if (currentQuestionIndex === -1) {
      setCurrentQuestionIndex(-2);
      return;
    }
    
    // Party Number (-2) → First Main Party (-1000)
    if (currentQuestionIndex === -2) {
      if (numberOfParties > 0) {
        setCurrentQuestionIndex(-1000);
      }
      return;
    }
    
    // Navegação entre Main Parties (-1000 a -1000 + N - 1)
    if (currentQuestionIndex >= -1000 && currentQuestionIndex < -1000 + numberOfParties - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return;
    }
    
    // Last Main Party → Other Parties Question (-4)
    if (currentQuestionIndex === -1000 + numberOfParties - 1) {
      setCurrentQuestionIndex(-4);
      return;
    }
    
    // Other Parties Question (-4) → Other Parties Number (-5) ou pular
    if (currentQuestionIndex === -4) {
      if (option === 'withOtherParties') {
        setCurrentQuestionIndex(-5);
      } else {
        // Pular outras partes, ir para repeatable fields ou location
        transitionFromOtherPartiesToNext();
      }
      return;
    }
    
    // Other Parties Number (-5) → First Other Party (-2000)
    if (currentQuestionIndex === -5) {
      if (numberOfOtherParties > 0) {
        setCurrentQuestionIndex(-2000);
      }
      return;
    }
    
    // Navegação entre Other Parties (-2000 a -2000 + M - 1)
    if (currentQuestionIndex >= -2000 && currentQuestionIndex < -2000 + numberOfOtherParties - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return;
    }
    
    // Last Other Party → Repeatable fields ou Location/Date
    if (currentQuestionIndex === -2000 + numberOfOtherParties - 1) {
      transitionFromOtherPartiesToNext();
      return;
    }
    
    // ============ BLOCO 2: PERGUNTAS REPETÍVEIS (0 - 999) ============
    if (currentQuestionIndex >= 0 && currentQuestionIndex < 1000) {
      if (!selectedTemplate) return;
      
      const repeatableFields = getRepeatableFields(selectedTemplate.fields);
      const totalRepeatableQuestions = numberOfParties * repeatableFields.length;
      const isLastRepeatable = (currentQuestionIndex === totalRepeatableQuestions - 1);
      
      console.log('[DEBUG] BLOCO 2 - Repeatable navigation:', {
        currentQuestionIndex,
        totalRepeatableQuestions,
        isLastRepeatable
      });
      
      if (isLastRepeatable) {
        // Terminamos as repetíveis, ir para Location/Date
        setCurrentQuestionIndex(-3);
      } else {
        // Próxima pergunta repetível
        setCurrentQuestionIndex(prev => prev + 1);
      }
      return;
    }
    
    // ============ Location/Date (-3) → BLOCO 3 ou BLOCO 4 ============
    if (currentQuestionIndex === -3) {
      if (!selectedTemplate) return;
      
      const nonRepeatableFields = getNonRepeatableVisibleFields(selectedTemplate.fields, formValues);
      
      console.log('[DEBUG] After location/date:', {
        nonRepeatableFieldsLength: nonRepeatableFields.length
      });
      
      if (nonRepeatableFields.length > 0) {
        setCurrentQuestionIndex(1000); // → BLOCO 3: Primeira Não-Repetível
      } else {
        setCurrentQuestionIndex(9999); // → BLOCO 4: Sumário
      }
      return;
    }
    
    // ============ BLOCO 3: PERGUNTAS NÃO-REPETÍVEIS (1000 - 9998) ============
    if (currentQuestionIndex >= 1000 && currentQuestionIndex < 9999) {
      if (!selectedTemplate) return;
      
      const nonRepeatableFields = getNonRepeatableVisibleFields(selectedTemplate.fields, formValues);
      const currentTemplateIndex = currentQuestionIndex - 1000;
      const isLastNonRepeatable = (currentTemplateIndex === nonRepeatableFields.length - 1);
      
      console.log('[DEBUG] BLOCO 3 - Non-repeatable navigation:', {
        currentQuestionIndex,
        currentTemplateIndex,
        totalNonRepeatableFields: nonRepeatableFields.length,
        isLastNonRepeatable
      });
      
      if (isLastNonRepeatable) {
        // Última pergunta não-repetível, ir para o Sumário
        setCurrentQuestionIndex(9999); // → BLOCO 4: Sumário
      } else {
        // Próxima pergunta não-repetível
        setCurrentQuestionIndex(prev => prev + 1);
      }
      return;
    }
    
    // ============ BLOCO 4: SUMÁRIO (9999) ============
    // Não há próximo após o sumário
  };

  const previousQuestion = () => {
    // Se estava em modo de edição e decidiu voltar, resetar o modo
    if (isEditingFromSummary) {
      console.log('[UX] Resetando modo de edição ao clicar em Anterior');
      setIsEditingFromSummary(false);
    }
    
    // ============ BLOCO 4: SUMÁRIO (9999) ============
    if (currentQuestionIndex === 9999) {
      if (!selectedTemplate) return;
      
      const nonRepeatableFields = getNonRepeatableVisibleFields(selectedTemplate.fields, formValues);
      if (nonRepeatableFields.length > 0) {
        // Voltar para última não-repetível
        setCurrentQuestionIndex(1000 + nonRepeatableFields.length - 1);
      } else {
        // Voltar para Location/Date
        setCurrentQuestionIndex(-3);
      }
      return;
    }
    
    // ============ BLOCO 3: PERGUNTAS NÃO-REPETÍVEIS (1000 - 9998) ============
    if (currentQuestionIndex >= 1000 && currentQuestionIndex < 9999) {
      if (currentQuestionIndex === 1000) {
        // Primeira não-repetível, voltar para Location/Date
        setCurrentQuestionIndex(-3);
      } else {
        // Voltar para pergunta anterior
        setCurrentQuestionIndex(prev => prev - 1);
      }
      return;
    }
    
    // ============ Location/Date (-3) ============
    if (currentQuestionIndex === -3) {
      if (!selectedTemplate) return;
      
      const repeatableFields = getRepeatableFields(selectedTemplate.fields);
      const totalRepeatableQuestions = numberOfParties * repeatableFields.length;
      
      if (totalRepeatableQuestions > 0) {
        // Voltar para última repetível
        setCurrentQuestionIndex(totalRepeatableQuestions - 1);
      } else if (numberOfOtherParties > 0) {
        // Voltar para última other party
        setCurrentQuestionIndex(-2000 + numberOfOtherParties - 1);
      } else {
        // Voltar para "other parties" question
        setCurrentQuestionIndex(-4);
      }
      return;
    }
    
    // ============ BLOCO 2: PERGUNTAS REPETÍVEIS (0 - 999) ============
    if (currentQuestionIndex >= 0 && currentQuestionIndex < 1000) {
      if (currentQuestionIndex === 0) {
        // Primeira repetível, voltar para outras partes ou main parties
        if (numberOfOtherParties > 0) {
          setCurrentQuestionIndex(-2000 + numberOfOtherParties - 1);
        } else {
          setCurrentQuestionIndex(-4);
        }
      } else {
        setCurrentQuestionIndex(prev => prev - 1);
      }
      return;
    }
    
    // ============ BLOCO 1: SISTEMA (Índices Negativos) ============
    
    // Party Number (-2) → Welcome (-1)
    if (currentQuestionIndex === -2) {
      setCurrentQuestionIndex(-1);
      return;
    }
    
    // First Main Party (-1000) → Party Number (-2)
    if (currentQuestionIndex === -1000) {
      setCurrentQuestionIndex(-2);
      return;
    }
    
    // Navegação entre Main Parties
    if (currentQuestionIndex > -1000 && currentQuestionIndex < -1000 + numberOfParties) {
      setCurrentQuestionIndex(prev => prev - 1);
      return;
    }
    
    // Other Parties Question (-4) → Last Main Party
    if (currentQuestionIndex === -4) {
      if (numberOfParties > 0) {
        setCurrentQuestionIndex(-1000 + numberOfParties - 1);
      }
      return;
    }
    
    // Other Parties Number (-5) → Other Parties Question (-4)
    if (currentQuestionIndex === -5) {
      setCurrentQuestionIndex(-4);
      return;
    }
    
    // First Other Party (-2000) → Other Parties Number (-5)
    if (currentQuestionIndex === -2000) {
      setCurrentQuestionIndex(-5);
      return;
    }
    
    // Navegação entre Other Parties
    if (currentQuestionIndex > -2000 && currentQuestionIndex < -2000 + numberOfOtherParties) {
      setCurrentQuestionIndex(prev => prev - 1);
      return;
    }
  };

  const goToQuestion = (index: number, triggeredFromSummary: boolean = false) => {
    // Permite navegação para todos os blocos: Bloco 1 (negativo), Bloco 2 (0-999), Bloco 3 (>=1000)
    // A validação de índices válidos é feita pela renderização condicional no QuestionnaireForm.tsx
    
    // Se a navegação foi iniciada do sumário, ativar modo de edição
    if (triggeredFromSummary) {
      console.log('[UX] Modo de edição ativado - navegação iniciada do sumário');
      setIsEditingFromSummary(true);
    }
    
    setCurrentQuestionIndex(index);
  };

  const saveAndReturnToSummary = () => {
    console.log('[UX] Salvando e retornando ao sumário');
    // Resetar o estado de edição
    setIsEditingFromSummary(false);
    // Navegar para o índice fixo do sumário (9999)
    setCurrentQuestionIndex(9999);
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
          // ⚠️ IMPORTANTE: Criar novo array para garantir que React detecte a mudança
          field.responses = [...field.responses, {
            partyId,
            partyName: party?.fullName || '',
            value
          }];
        } else {
          // Atualizar resposta existente
          // ⚠️ IMPORTANTE: Criar novo array para garantir que React detecte a mudança
          // Cópia shallow de 'field' NÃO copia o array 'responses' aninhado
          field.responses = field.responses.map((response, idx) =>
            idx === responseIndex
              ? { ...response, value } // Criar novo objeto com valor atualizado
              : response
          );
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
          
          // Substituir AMBOS os padrões: [field_id] e [field_id_formatted]
          const placeholderPattern = new RegExp(`\\[${escapedFieldId}\\]`, 'g');
          const formattedPlaceholderPattern = new RegExp(`\\[${escapedFieldId}_formatted\\]`, 'g');
          
          filledTemplate = filledTemplate.replace(placeholderPattern, formattedText);
          filledTemplate = filledTemplate.replace(formattedPlaceholderPattern, formattedText);
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
        isEditingFromSummary,
        selectTemplate,
        updateFormValue,
        resetForm,
        fillContractTemplate,
        nextQuestion,
        previousQuestion,
        goToQuestion,
        saveAndReturnToSummary,
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
