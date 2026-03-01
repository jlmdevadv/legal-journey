import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { ContractTemplate as DataContractTemplate } from "../data/contractTemplates";
import { PartyData, ContractField, RepeatableFieldResponse, ContractTemplate } from "../types/template";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getVisibleFields, getRepeatableVisibleFields, getNonRepeatableVisibleFields } from "@/utils/conditionalLogic";
import { formatDateToBrazilian } from "@/utils/dateUtils";
import { generatePDF } from "@/utils/pdfGenerator";

interface LocationData {
  city: string;
  state: string;
  date: string;
}

interface SavedContract {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  status: "draft" | "completed" | "archived";
  form_values: Record<string, string>;
  parties_data: PartyData[];
  number_of_parties: number;
  other_parties_data: PartyData[];
  number_of_other_parties: number;
  has_other_parties: boolean;
  location_data: LocationData;
  repeatable_fields_data: RepeatableFieldResponse[];
  current_question_index: number;
  current_party_loop_index: number;
  generated_document: string | null;
  created_at: string;
  updated_at: string;
  contract_templates?: {
    name: string;
  } | null;
  organization_id?: string | null;
  review_notes?: string | null;
  reviewed_at?: string | null;
}

interface ContractContextType {
  selectedTemplate: ContractTemplate | null;
  formValues: Record<string, string>;
  currentQuestionIndex: number;
  currentPartyLoopIndex: number;
  isQuestionnaireMode: boolean;
  customTemplates: ContractTemplate[];
  isLoadingTemplates: boolean;
  editingTemplate: ContractTemplate | null;
  numberOfParties: number;
  partiesData: PartyData[];
  currentPartyIndex: number;
  numberOfOtherParties: number;
  otherPartiesData: PartyData[];
  hasOtherParties: boolean;
  updateHasOtherParties: (value: boolean) => void;
  partyTypes: any[];
  locationData: LocationData;
  repeatableFieldsData: RepeatableFieldResponse[];
  isEditingFromSummary: boolean;
  currentSavedContractId: string | null;
  getAllVisibleFieldsSorted: () => ContractField[];
  selectTemplate: (template: ContractTemplate) => void;
  updateFormValue: (fieldId: string, value: string) => void;
  resetForm: () => void;
  fillContractTemplate: () => string;
  generatePreviewText: () => string;
  generateFinalDocument: () => string;
  nextQuestion: (option?: string) => void;
  previousQuestion: () => void;
  goToQuestion: (index: number, triggeredFromSummary?: boolean) => void;
  saveAndReturnToSummary: () => void;
  startQuestionnaire: () => void;
  finishQuestionnaire: () => void;
  addCustomTemplate: (template: ContractTemplate) => void;
  updateCustomTemplate: (id: string, template: ContractTemplate) => void;
  deleteCustomTemplate: (id: string) => void;
  renameTemplate: (id: string, newName: string) => void;
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
  saveContract: (name?: string, showToast?: boolean) => Promise<string | null>;
  loadContract: (contractId: string) => Promise<boolean>;
  listUserContracts: () => Promise<SavedContract[]>;
  deleteContract: (contractId: string) => Promise<boolean>;
  downloadPDF: () => Promise<void>;
  currentContractStatus: string | null;
  currentContractReviewNotes: string | null;
  currentContractReviewedAt: string | null;
  currentContractOrganizationId: string | null;
  resubmitForReview: () => Promise<boolean>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [isQuestionnaireMode, setIsQuestionnaireMode] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<ContractTemplate[]>([]);
  const [currentSavedContractId, setCurrentSavedContractId] = useState<string | null>(null);
  const [currentContractStatus, setCurrentContractStatus] = useState<string | null>(null);
  const [currentContractReviewNotes, setCurrentContractReviewNotes] = useState<string | null>(null);
  const [currentContractReviewedAt, setCurrentContractReviewedAt] = useState<string | null>(null);
  const [currentContractOrganizationId, setCurrentContractOrganizationId] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [numberOfParties, setNumberOfParties] = useState<number>(0);
  const [partiesData, setPartiesData] = useState<PartyData[]>([]);
  const [currentPartyIndex, setCurrentPartyIndex] = useState<number>(0);
  const [numberOfOtherParties, setNumberOfOtherPartiesState] = useState<number>(0);
  const [otherPartiesData, setOtherPartiesData] = useState<PartyData[]>([]);
  const [hasOtherParties, setHasOtherParties] = useState<boolean>(false); // ✅ NOVO - Estado de controle
  const [partyTypes, setPartyTypes] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<LocationData>({
    city: "",
    state: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [repeatableFieldsData, setRepeatableFieldsData] = useState<RepeatableFieldResponse[]>([]);
  const [isEditingFromSummary, setIsEditingFromSummary] = useState(false);
  const [currentPartyLoopIndex, setCurrentPartyLoopIndex] = useState<number>(0); // ✅ NOVO v3.0

  // Load templates and party types from Supabase on mount
  useEffect(() => {
    loadTemplatesFromSupabase();
    loadPartyTypes();
  }, []);

  // 🛡️ CORREÇÃO 1: useEffect com debounce para cleanup controlado
  const prevFormValuesRef = useRef(formValues);
  const isCleaningRef = useRef(false);

  useEffect(() => {
    // Evitar loop: não executar se já estamos limpando
    if (isCleaningRef.current || !selectedTemplate) return;

    // Calcular visibilidade ANTES e DEPOIS
    const prevVisible = new Set<string>();
    const currentVisible = new Set<string>();

    // Campos visíveis com formValues anterior
    if (Object.keys(prevFormValuesRef.current).length > 0) {
      const prevNonRepeatable = getNonRepeatableVisibleFields(selectedTemplate.fields, prevFormValuesRef.current);
      const prevRepeatable = getRepeatableVisibleFields(selectedTemplate.fields, prevFormValuesRef.current);
      prevNonRepeatable.forEach((f) => prevVisible.add(f.id));
      prevRepeatable.forEach((f) => prevVisible.add(f.id));
    }

    // Campos visíveis com formValues atual
    const currentNonRepeatable = getNonRepeatableVisibleFields(selectedTemplate.fields, formValues);
    const currentRepeatable = getRepeatableVisibleFields(selectedTemplate.fields, formValues);
    currentNonRepeatable.forEach((f) => currentVisible.add(f.id));
    currentRepeatable.forEach((f) => currentVisible.add(f.id));

    // Verificar se a visibilidade MUDOU
    const prevKeys = Array.from(prevVisible).sort().join(",");
    const currentKeys = Array.from(currentVisible).sort().join(",");

    if (prevKeys !== currentKeys) {
      console.log("[CLEANUP] Visibilidade mudou, executando limpeza...");
      isCleaningRef.current = true;

      const timer = setTimeout(() => {
        cleanHiddenFieldValues();
        isCleaningRef.current = false;
      }, 0);

      prevFormValuesRef.current = formValues;

      return () => clearTimeout(timer);
    }

    prevFormValuesRef.current = formValues;
  }, [formValues, selectedTemplate]);

  const loadPartyTypes = async () => {
    try {
      const { data, error } = await supabase.from("party_types").select("*").order("display_order");

      if (error) throw error;

      setPartyTypes(data || []);
    } catch (error) {
      console.error("Erro ao carregar tipos de partes:", error);
      toast.error("Erro ao carregar tipos de partes");
    }
  };

  const loadTemplatesFromSupabase = async () => {
    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const templates = data.map((t) => {
          // Inicializar display_order se não existir
          const fields = (t.fields as any as ContractField[]).map((field, index) => ({
            ...field,
            display_order: field.display_order ?? index,
          }));

          return {
            ...t,
            fields,
            version: t.version as any,
          };
        }) as ContractTemplate[];

        setCustomTemplates(templates);
        console.log(`✅ Carregados ${templates.length} templates do banco`);
      } else {
        // Se banco vazio, fazer seed automático
        console.log("📦 Banco vazio, executando seed...");
        const { seedDefaultTemplates } = await import("@/utils/seedDefaultTemplates");
        await seedDefaultTemplates();
        // Recarregar após seed
        await loadTemplatesFromSupabase();
      }
    } catch (error) {
      console.error("❌ Erro ao carregar templates:", error);
      toast.error("Erro ao carregar templates do banco");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Migrate localStorage data to Supabase (run once)
  const migrateLocalStorageToSupabase = async () => {
    const stored = localStorage.getItem("customTemplates");
    if (!stored) return;

    try {
      const localTemplates = JSON.parse(stored);
      if (localTemplates.length === 0) return;

      const { error } = await supabase.from("contract_templates").insert(localTemplates);

      if (error) throw error;

      localStorage.removeItem("customTemplates");
      toast.success("Templates migrados com sucesso!");
      loadTemplatesFromSupabase();
    } catch (error) {
      console.error("Erro ao migrar templates:", error);
      toast.error("Erro ao migrar templates");
    }
  };

  const formatDate = (date: Date): string => {
    return date
      .toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
      .replace(/\//g, ".");
  };

  const incrementVersion = (currentVersion?: string): string => {
    if (!currentVersion || !currentVersion.includes("v.")) {
      return "v. 1.0";
    }

    const versionMatch = currentVersion.match(/v\. (\d+)\.(\d+)/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);
      return `v. ${major}.${minor + 1}`;
    }

    return "v. 1.1";
  };

  const initializeTemplateVersion = (template: ContractTemplate): ContractTemplate => {
    if (!template.version) {
      const today = formatDate(new Date());
      return {
        ...template,
        version: {
          version: "v. 1.0",
          date: today,
          createdDate: today,
        },
      };
    }
    return template;
  };

  const updateTemplateVersion = (template: ContractTemplate): ContractTemplate => {
    const today = formatDate(new Date());
    const currentVersion = template.version?.version || "v. 1.0";
    const newVersion = incrementVersion(currentVersion);

    return {
      ...template,
      version: {
        version: newVersion,
        date: today,
        createdDate: template.version?.createdDate || today,
      },
    };
  };

  const selectTemplate = (template: ContractTemplate) => {
    // Ordenar campos por display_order antes de usar
    const sortedTemplate = {
      ...template,
      fields: sortFieldsByDisplayOrder(template.fields),
    };

    setSelectedTemplate(sortedTemplate);
    // Initialize form values with empty strings for each field
    const initialValues: Record<string, string> = {};
    sortedTemplate.fields.forEach((field) => {
      initialValues[field.id] = "";
    });
    setFormValues(initialValues);
    setCurrentQuestionIndex(-1);
    setIsQuestionnaireMode(false);
    // Reset party data
    setNumberOfParties(0);
    setPartiesData([]);
    setCurrentPartyIndex(0);
    setLocationData({ city: "", state: "", date: "" });
    setRepeatableFieldsData([]);
  };

  const updateFormValue = (fieldId: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // 🛡️ FASE 1: Limpeza de valores de campos ocultos
  const cleanHiddenFieldValues = () => {
    if (!selectedTemplate) return;

    const visibleNonRepeatableFields = getNonRepeatableVisibleFields(selectedTemplate.fields, formValues);
    const visibleRepeatableFields = getRepeatableVisibleFields(selectedTemplate.fields, formValues);
    const visibleFieldIds = new Set([
      ...visibleNonRepeatableFields.map((f) => f.id),
      ...visibleRepeatableFields.map((f) => f.id),
    ]);

    // Limpar formValues
    setFormValues((prev) => {
      const cleaned: Record<string, string> = {};
      let hasChanges = false;

      Object.entries(prev).forEach(([fieldId, value]) => {
        if (visibleFieldIds.has(fieldId)) {
          cleaned[fieldId] = value;
        } else {
          hasChanges = true;
          console.log(`[CLEANUP] Removendo valor de campo oculto: ${fieldId}`);
        }
      });

      return hasChanges ? cleaned : prev; // Só atualiza se houver mudanças
    });

    // Limpar repeatableFieldsData
    setRepeatableFieldsData((prev) => {
      const cleaned = prev.filter((fieldData) => visibleFieldIds.has(fieldData.fieldId));

      if (cleaned.length !== prev.length) {
        const removed = prev.filter((f) => !visibleFieldIds.has(f.fieldId));
        removed.forEach((f) => console.log(`[CLEANUP] Removendo dados repetíveis: ${f.fieldId}`));
      }

      return cleaned.length !== prev.length ? cleaned : prev;
    });
  };

  const resetForm = () => {
    console.log("[RESET] Resetting form and clearing all state");

    setFormValues({});
    setSelectedTemplate(null);
    setCurrentQuestionIndex(-1);
    setIsQuestionnaireMode(false);
    setNumberOfParties(0);
    setPartiesData([]);
    setCurrentPartyIndex(0);
    setCurrentPartyLoopIndex(0);
    setNumberOfOtherPartiesState(0); // ✅ Limpar numberOfOtherParties
    setOtherPartiesData([]); // ✅ Limpar otherPartiesData
    setHasOtherParties(false); // ✅ Resetar decisão sobre outras partes
    setLocationData({ city: "", state: "", date: "" });
    setRepeatableFieldsData([]);

    console.log("[RESET] ✅ Form reset completed");
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

  // ✅ NOVO v3.0: Helper para obter campos ordenados
  const getAllVisibleFieldsSorted = (): ContractField[] => {
    if (!selectedTemplate) return [];

    const visible = getVisibleFields(selectedTemplate.fields, formValues);
    const sorted = [...visible].sort((a, b) => {
      const orderA = a.display_order ?? 999999;
      const orderB = b.display_order ?? 999999;
      return orderA - orderB;
    });

    console.log("[DEBUG] getAllVisibleFieldsSorted:", {
      totalFields: sorted.length,
      order: sorted.map((f) => ({ id: f.id, display_order: f.display_order, repeatable: f.repeatPerParty })),
    });

    return sorted;
  };

  /**
   * Atualiza a decisão sobre incluir 'Outras Partes' e limpa os
   * estados dependentes (numberOfOtherParties, otherPartiesData)
   * se a resposta for 'Não', garantindo a integridade do estado.
   *
   * @param {boolean} value - O novo valor (true=Sim, false=Não) para 'hasOtherParties'.
   */
  const updateHasOtherParties = (value: boolean) => {
    console.log("[CLEANUP] updateHasOtherParties called:", { value });

    // 1. Atualiza o estado de controle principal
    setHasOtherParties(value);

    // 2. Lógica de Limpeza Atômica
    if (value === false) {
      // Se o usuário "desistiu" de incluir outras partes,
      // limpamos proativamente os estados dependentes.
      console.log("[CLEANUP] hasOtherParties set to false. Cleaning up dependent state:", {
        previousNumberOfOtherParties: numberOfOtherParties,
        previousOtherPartiesDataLength: otherPartiesData.length,
      });

      setNumberOfOtherPartiesState(0);
      setOtherPartiesData([]);

      console.log("[CLEANUP] ✅ Dependent state cleaned successfully.");
    }
  };

  const nextQuestion = (option?: string) => {
    // ============ HELPER FUNCTION ============
    // Helper function: transição de outras partes para próximo bloco
    const transitionFromOtherPartiesToNext = () => {
      if (!selectedTemplate) return;

      const allFields = getAllVisibleFieldsSorted();

      if (allFields.length > 0) {
        // Ir para primeira pergunta do template (BLOCO 2 unificado)
        console.log("[DEBUG] Transitioning to first template question");
        setCurrentQuestionIndex(0);
        setCurrentPartyLoopIndex(0);
      } else {
        // Sem perguntas, ir direto para Location/Date
        console.log("[DEBUG] No template questions, going to Location/Date");
        setCurrentQuestionIndex(9998);
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
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    // Last Main Party → Other Parties Question (-4)
    if (currentQuestionIndex === -1000 + numberOfParties - 1) {
      setCurrentQuestionIndex(-4);
      return;
    }

    // Other Parties Question (-4) → Other Parties Number (-5) ou pular
    if (currentQuestionIndex === -4) {
      if (option === "withOtherParties") {
        console.log("[NAVIGATION] User chose to include other parties");
        updateHasOtherParties(true); // ✅ Atualizar estado (sem limpeza)
        setCurrentQuestionIndex(-5);
      } else {
        console.log("[NAVIGATION] User chose NOT to include other parties");
        updateHasOtherParties(false); // ✅ Atualizar estado + LIMPAR dados
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
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    // Last Other Party → Repeatable fields ou Location/Date
    if (currentQuestionIndex === -2000 + numberOfOtherParties - 1) {
      transitionFromOtherPartiesToNext();
      return;
    }

    // ============ BLOCO 2: PERGUNTAS UNIFICADAS (0+) ============
    if (currentQuestionIndex >= 0 && currentQuestionIndex < 9998) {
      const allFields = getAllVisibleFieldsSorted();

      // Verificar se índice está dentro do array (proteção adicional)
      if (currentQuestionIndex >= allFields.length) {
        console.error("[DEBUG] ERRO: currentQuestionIndex fora dos limites!", {
          currentQuestionIndex,
          allFieldsLength: allFields.length,
        });
        setCurrentQuestionIndex(9998);
        setCurrentPartyLoopIndex(0);
        return;
      }

      const currentField = allFields[currentQuestionIndex];

      console.log("[DEBUG] BLOCO 2 - Current field:", {
        currentQuestionIndex,
        currentPartyLoopIndex,
        fieldId: currentField.id,
        isRepeatable: currentField.repeatPerParty,
        numberOfParties,
        totalFields: allFields.length,
        isLastField: currentQuestionIndex === allFields.length - 1,
      });

      // CASO 1: Campo repetível e ainda há partes para responder
      if (currentField.repeatPerParty === true && numberOfParties > 0) {
        if (currentPartyLoopIndex < numberOfParties - 1) {
          // Ainda há partes para responder este campo
          console.log("[DEBUG] BLOCO 2 - Próxima parte para o mesmo campo");
          setCurrentPartyLoopIndex((prev) => prev + 1);
          return;
        }
        // Se chegou aqui: última parte já respondeu, devemos avançar
      }

      // Se chegou aqui: campo não repetível OU última parte de campo repetível
      // Resetar o loop de partes para o próximo card
      setCurrentPartyLoopIndex(0);

      // CASO 2: Verificar se este é o ÚLTIMO campo da lista
      if (currentQuestionIndex === allFields.length - 1) {
        console.log("[DEBUG] BLOCO 2 - ✅ Fim de todos os campos. Transição para Local/Data (9998)");
        setCurrentQuestionIndex(9998);
        return;
      }

      // CASO 3: Não é o último campo, avançar para o próximo
      console.log("[DEBUG] BLOCO 2 - Próximo campo no display_order");
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    // ============ BLOCO 3: Location/Date (9998) ============
    if (currentQuestionIndex === 9998) {
      // Ir para Sumário
      setCurrentQuestionIndex(9999);
      return;
    }

    // ============ BLOCO 4: SUMÁRIO (9999) ============
    // Não há próximo após o sumário
  };

  const previousQuestion = () => {
    // Se estava em modo de edição e decidiu voltar, resetar o modo
    if (isEditingFromSummary) {
      console.log("[UX] Resetando modo de edição ao clicar em Anterior");
      setIsEditingFromSummary(false);
    }

    // ============ BLOCO 4: SUMÁRIO (9999) ============
    if (currentQuestionIndex === 9999) {
      // Voltar para Location/Date
      setCurrentQuestionIndex(9998);
      return;
    }

    // ============ BLOCO 3: Location/Date (9998) ============
    if (currentQuestionIndex === 9998) {
      const allFields = getAllVisibleFieldsSorted();

      if (allFields.length === 0) {
        // Não há perguntas, voltar para outras partes ou main parties
        if (numberOfOtherParties > 0) {
          setCurrentQuestionIndex(-2000 + numberOfOtherParties - 1);
        } else {
          setCurrentQuestionIndex(-4);
        }
        return;
      }

      // Voltar para última pergunta do template
      const lastField = allFields[allFields.length - 1];

      if (lastField.repeatPerParty && numberOfParties > 0) {
        // Última pergunta é repetível → posicionar na última parte
        setCurrentQuestionIndex(allFields.length - 1);
        setCurrentPartyLoopIndex(numberOfParties - 1);
      } else {
        // Última pergunta não é repetível
        setCurrentQuestionIndex(allFields.length - 1);
        setCurrentPartyLoopIndex(0);
      }
      return;
    }

    // ============ BLOCO 2: PERGUNTAS UNIFICADAS (0+) ============
    if (currentQuestionIndex >= 0 && currentQuestionIndex < 9998) {
      const allFields = getAllVisibleFieldsSorted();

      // Primeira pergunta do template
      if (currentQuestionIndex === 0 && currentPartyLoopIndex === 0) {
        // Voltar para outras partes ou main parties
        if (numberOfOtherParties > 0) {
          setCurrentQuestionIndex(-2000 + numberOfOtherParties - 1);
        } else {
          setCurrentQuestionIndex(-4);
        }
        return;
      }

      const currentField = allFields[currentQuestionIndex];

      console.log("[DEBUG] BLOCO 2 - Previous navigation:", {
        currentQuestionIndex,
        currentPartyLoopIndex,
        fieldId: currentField?.id,
        isRepeatable: currentField?.repeatPerParty,
      });

      // CASO 1: Campo repetível com partyIndex > 0 → voltar para parte anterior
      if (currentField?.repeatPerParty && currentPartyLoopIndex > 0) {
        console.log("[DEBUG] BLOCO 2 - Previous party for same field");
        setCurrentPartyLoopIndex((prev) => prev - 1);
        return;
      }

      // CASO 2: Voltar para campo anterior
      if (currentQuestionIndex > 0) {
        const prevField = allFields[currentQuestionIndex - 1];

        if (prevField.repeatPerParty && numberOfParties > 0) {
          // Campo anterior é repetível → posicionar na última parte
          console.log("[DEBUG] BLOCO 2 - Previous field (repeatable, last party)");
          setCurrentQuestionIndex((prev) => prev - 1);
          setCurrentPartyLoopIndex(numberOfParties - 1);
        } else {
          // Campo anterior não é repetível
          console.log("[DEBUG] BLOCO 2 - Previous field (non-repeatable)");
          setCurrentQuestionIndex((prev) => prev - 1);
          setCurrentPartyLoopIndex(0);
        }
        return;
      }
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
      setCurrentQuestionIndex((prev) => prev - 1);
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
      console.log("[NAVIGATION] Going back from Other Parties Number to Other Parties Question");
      // Nota: NÃO limpamos dados aqui, pois o usuário pode estar apenas revisando
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
      setCurrentQuestionIndex((prev) => prev - 1);
      return;
    }
  };

  const goToQuestion = (index: number, triggeredFromSummary: boolean = false) => {
    // Permite navegação para todos os blocos: Bloco 1 (negativo), Bloco 2 (0-999), Bloco 3 (>=1000)
    // A validação de índices válidos é feita pela renderização condicional no QuestionnaireForm.tsx

    // Se a navegação foi iniciada do sumário, ativar modo de edição
    if (triggeredFromSummary) {
      console.log("[UX] Modo de edição ativado - navegação iniciada do sumário");
      setIsEditingFromSummary(true);
    }

    setCurrentQuestionIndex(index);
  };

  // Salvar e retornar ao sumário
  const saveAndReturnToSummary = () => {
    console.log("[UX] Salvando e retornando ao sumário...");
    setIsEditingFromSummary(false);
    setCurrentQuestionIndex(9999);
  };

  // Funções para campos repetíveis
  const updateRepeatableFieldValue = (fieldId: string, partyId: string, value: string) => {
    setRepeatableFieldsData((prev) => {
      const existingFieldIndex = prev.findIndex((f) => f.fieldId === fieldId);

      if (existingFieldIndex === -1) {
        // Campo ainda não existe, criar novo
        const party = partiesData.find((p) => p.id === partyId);
        return [
          ...prev,
          {
            fieldId,
            responses: [
              {
                partyId,
                partyName: party?.fullName || "",
                value,
              },
            ],
          },
        ];
      } else {
        // Campo existe, atualizar ou adicionar resposta da parte
        const updated = [...prev];
        const field = { ...updated[existingFieldIndex] };
        const responseIndex = field.responses.findIndex((r) => r.partyId === partyId);

        if (responseIndex === -1) {
          // Parte ainda não respondeu, adicionar
          const party = partiesData.find((p) => p.id === partyId);
          // ⚠️ IMPORTANTE: Criar novo array para garantir que React detecte a mudança
          field.responses = [
            ...field.responses,
            {
              partyId,
              partyName: party?.fullName || "",
              value,
            },
          ];
        } else {
          // Atualizar resposta existente
          // ⚠️ IMPORTANTE: Criar novo array para garantir que React detecte a mudança
          // Cópia shallow de 'field' NÃO copia o array 'responses' aninhado
          field.responses = field.responses.map((response, idx) =>
            idx === responseIndex
              ? { ...response, value } // Criar novo objeto com valor atualizado
              : response,
          );
        }

        updated[existingFieldIndex] = field;
        return updated;
      }
    });
  };

  const getRepeatableFieldValue = (fieldId: string, partyId: string): string => {
    const field = repeatableFieldsData.find((f) => f.fieldId === fieldId);
    if (!field) return "";

    const response = field.responses.find((r) => r.partyId === partyId);
    return response?.value || "";
  };

  const getRepeatableFieldFormattedText = (fieldId: string): string => {
    const field = repeatableFieldsData.find((f) => f.fieldId === fieldId);
    if (!field || field.responses.length === 0) return `[${fieldId}]`;

    // Formatar: "Nome da Parte: Resposta\n"
    return field.responses
      .filter((r) => r.value.trim() !== "") // Ignorar respostas vazias
      .map((r) => `${r.partyName}: ${r.value}`)
      .join("\n");
  };

  // ========== CLÁUSULAS CONDICIONAIS ==========
  // Parser de cláusulas condicionais {{#if}}...{{/if}}
  const parseConditionalClauses = (templateText: string, formValues: Record<string, string>): string => {
    console.log("[CONDITIONAL-CLAUSES] Iniciando parsing...");

    // Regex para detectar blocos {{#if condition}}...{{/if}}
    // Captura: grupo 1 = condição completa, grupo 2 = conteúdo interno
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    let parsedText = templateText;
    let match;

    while ((match = conditionalRegex.exec(templateText)) !== null) {
      const fullMatch = match[0]; // Bloco completo {{#if}}...{{/if}}
      const conditionStr = match[1].trim(); // String da condição
      const innerContent = match[2]; // Conteúdo interno

      console.log(`[CONDITIONAL-CLAUSES] Encontrado bloco:`, { conditionStr, innerContent });

      // Parsear condição (suporta AND/OR)
      const conditionResult = evaluateConditionalString(conditionStr, formValues);

      if (conditionResult) {
        // Condição verdadeira: manter conteúdo interno (remover apenas tags)
        parsedText = parsedText.replace(fullMatch, innerContent);
        console.log(`[CONDITIONAL-CLAUSES] ✅ Condição VERDADEIRA - mantendo conteúdo`);
      } else {
        // Condição falsa: remover bloco inteiro
        parsedText = parsedText.replace(fullMatch, "");
        console.log(`[CONDITIONAL-CLAUSES] ❌ Condição FALSA - removendo bloco`);
      }
    }

    return parsedText;
  };

  // Avalia string de condição (ex: "campo equals 'valor' AND outro greaterThan '10'")
  const evaluateConditionalString = (conditionStr: string, formValues: Record<string, string>): boolean => {
    // Dividir por AND/OR
    const andParts = conditionStr.split(/\s+AND\s+/i);

    // Se tem AND, TODAS as partes devem ser verdadeiras
    if (andParts.length > 1) {
      return andParts.every((part) => evaluateSingleCondition(part.trim(), formValues));
    }

    const orParts = conditionStr.split(/\s+OR\s+/i);

    // Se tem OR, PELO MENOS UMA parte deve ser verdadeira
    if (orParts.length > 1) {
      return orParts.some((part) => evaluateSingleCondition(part.trim(), formValues));
    }

    // Condição simples
    return evaluateSingleCondition(conditionStr, formValues);
  };

  // Avalia condição individual (ex: "campo equals 'valor'")
  const evaluateSingleCondition = (conditionStr: string, formValues: Record<string, string>): boolean => {
    // Regex: campo_id operator "valor" (com suporte a aspas simples/duplas)
    const conditionRegex = /^(\w+)\s+(equals|notEquals|contains|greaterThan|lessThan)\s+["'](.+?)["']$/i;
    const match = conditionStr.match(conditionRegex);

    if (!match) {
      console.warn(`[CONDITIONAL-CLAUSES] Condição inválida: ${conditionStr}`);
      return false;
    }

    const [, fieldId, operator, expectedValue] = match;
    const actualValue = formValues[fieldId] || "";

    console.log(
      `[CONDITIONAL-CLAUSES] Avaliando: ${fieldId} ${operator} "${expectedValue}" (valor atual: "${actualValue}")`,
    );

    switch (operator.toLowerCase()) {
      case "equals":
        return actualValue === expectedValue;
      case "notequals":
        return actualValue !== expectedValue;
      case "contains":
        return actualValue.includes(expectedValue);
      case "greaterthan":
        return Number(actualValue) > Number(expectedValue);
      case "lessthan":
        return Number(actualValue) < Number(expectedValue);
      default:
        return false;
    }
  };

  // ========== ORDENAÇÃO DE CAMPOS ==========
  const sortFieldsByDisplayOrder = (fields: ContractField[]): ContractField[] => {
    return [...fields].sort((a, b) => {
      const orderA = a.display_order ?? 999999;
      const orderB = b.display_order ?? 999999;
      return orderA - orderB;
    });
  };

  // 🎨 CORREÇÃO 2: Função para PREVIEW (mantém placeholders visíveis)
  const generatePreviewText = (): string => {
    if (!selectedTemplate) return "";

    // ✅ ETAPA 1: Processar cláusulas condicionais PRIMEIRO
    let filledTemplate = parseConditionalClauses(selectedTemplate.template, formValues);

    // Obter campos visíveis ATUAIS (sem chamar cleanup)
    const visibleNonRepeatableFields = getNonRepeatableVisibleFields(selectedTemplate.fields, formValues);
    const visibleRepeatableFields = getRepeatableVisibleFields(selectedTemplate.fields, formValues);
    const visibleFieldIds = new Set([
      ...visibleNonRepeatableFields.map((f) => f.id),
      ...visibleRepeatableFields.map((f) => f.id),
    ]);

    // 1. Replace campos repetíveis VISÍVEIS
    selectedTemplate.fields
      .filter((field) => field.repeatPerParty === true && visibleFieldIds.has(field.id))
      .forEach((field) => {
        const formattedText = getRepeatableFieldFormattedText(field.id);
        const escapedFieldId = field.id.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const placeholderPattern = new RegExp(`\\[${escapedFieldId}\\]`, "g");
        const formattedPlaceholderPattern = new RegExp(`\\[${escapedFieldId}_formatted\\]`, "g");

        // Se vazio, manter placeholder [fieldId] para indicar que precisa preencher
        const replacement = formattedText || `[${field.id}]`;
        filledTemplate = filledTemplate.replace(placeholderPattern, replacement);
        filledTemplate = filledTemplate.replace(formattedPlaceholderPattern, replacement);
      });

    // 2. Replace campos normais VISÍVEIS (mantendo placeholders para campos vazios)
    Object.entries(formValues).forEach(([fieldId, value]) => {
      if (visibleFieldIds.has(fieldId)) {
        const field = selectedTemplate.fields.find((f) => f.id === fieldId);
        const escapedFieldId = fieldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const placeholderPattern = new RegExp(`\\[${escapedFieldId}\\]`, "g");

        // Verificar includeValueInContract (Item 1)
        const shouldInclude = field?.includeValueInContract !== false; // default: true

        if (!shouldInclude && field?.type === "select") {
          // Campo select que NÃO deve incluir valor no contrato
          filledTemplate = filledTemplate.replace(placeholderPattern, "");
          console.log(`[SELECT-OMIT] Campo "${fieldId}" omitido do preview (includeValueInContract=false)`);
        } else {
          // Comportamento normal: Se vazio, manter [fieldId] visível no preview
          const replacement = value.trim() ? value : `[${fieldId}]`;
          filledTemplate = filledTemplate.replace(placeholderPattern, replacement);
        }
      }
    });

    // 3. Remover APENAS placeholders de campos OCULTOS (não visíveis)
    const placeholderRegex = /\[([a-zA-Z0-9_-]+)\]/g;
    const remainingPlaceholders = new Set<string>();
    let match;

    while ((match = placeholderRegex.exec(filledTemplate)) !== null) {
      remainingPlaceholders.add(match[1]);
    }

    remainingPlaceholders.forEach((fieldId) => {
      if (["city", "state", "signing-date"].includes(fieldId)) return;

      const field = selectedTemplate.fields.find((f) => f.id === fieldId);
      const isHidden = field && !visibleFieldIds.has(fieldId);

      // Só remover se o campo estiver OCULTO (não visível)
      if (isHidden) {
        const escapedFieldId = fieldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const lineRemovalPattern = new RegExp(`^.*\\[${escapedFieldId}\\].*\\n?`, "gm");
        filledTemplate = filledTemplate.replace(lineRemovalPattern, "");
      }
    });

    // 4. Replace location and date placeholders
    filledTemplate = filledTemplate.replace(/\[city\]/g, locationData.city || "[city]");
    filledTemplate = filledTemplate.replace(/\[state\]/g, locationData.state || "[state]");
    filledTemplate = filledTemplate.replace(
      /\[signing-date\]/g,
      locationData.date ? formatDateToBrazilian(locationData.date) : "[signing-date]",
    );

    return filledTemplate;
  };

  // 📄 CORREÇÃO 2: Função para DOCUMENTO FINAL (aplica Smart Replacement)
  const generateFinalDocument = (): string => {
    if (!selectedTemplate) return "";

    // ✅ ETAPA 1: Processar cláusulas condicionais PRIMEIRO
    let filledTemplate = parseConditionalClauses(selectedTemplate.template, formValues);

    // Obter campos visíveis
    const visibleNonRepeatableFields = getNonRepeatableVisibleFields(selectedTemplate.fields, formValues);
    const visibleRepeatableFields = getRepeatableVisibleFields(selectedTemplate.fields, formValues);
    const visibleFieldIds = new Set([
      ...visibleNonRepeatableFields.map((f) => f.id),
      ...visibleRepeatableFields.map((f) => f.id),
    ]);

    // 1. Replace campos repetíveis VISÍVEIS
    selectedTemplate.fields
      .filter((field) => field.repeatPerParty === true && visibleFieldIds.has(field.id))
      .forEach((field) => {
        const formattedText = getRepeatableFieldFormattedText(field.id);
        const escapedFieldId = field.id.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const placeholderPattern = new RegExp(`\\[${escapedFieldId}\\]`, "g");
        const formattedPlaceholderPattern = new RegExp(`\\[${escapedFieldId}_formatted\\]`, "g");

        filledTemplate = filledTemplate.replace(placeholderPattern, formattedText);
        filledTemplate = filledTemplate.replace(formattedPlaceholderPattern, formattedText);
      });

    // 2. Replace campos normais VISÍVEIS
    Object.entries(formValues).forEach(([fieldId, value]) => {
      if (visibleFieldIds.has(fieldId)) {
        const field = selectedTemplate.fields.find((f) => f.id === fieldId);
        const escapedFieldId = fieldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const placeholderPattern = new RegExp(`\\[${escapedFieldId}\\]`, "g");

        // Verificar includeValueInContract (Item 1)
        const shouldInclude = field?.includeValueInContract !== false;

        if (!shouldInclude && field?.type === "select") {
          // Campo select que NÃO deve incluir valor no contrato
          const lineRemovalPattern = new RegExp(`^.*\\[${escapedFieldId}\\].*\\n?`, "gm");
          filledTemplate = filledTemplate.replace(lineRemovalPattern, "");
          console.log(`[SELECT-OMIT] Campo "${fieldId}" e sua linha removidos do documento final`);
        } else if (field && !field.required && (!value || value.trim() === "")) {
          // Smart Placeholder Replacement: Remove linha inteira se campo opcional vazio
          const lineRemovalPattern = new RegExp(`^.*\\[${escapedFieldId}\\].*\\n?`, "gm");
          filledTemplate = filledTemplate.replace(lineRemovalPattern, "");
          console.log(`[SMART-CLEANUP] Removendo linha do campo opcional vazio: ${fieldId}`);
        } else {
          // Substituir normalmente
          filledTemplate = filledTemplate.replace(placeholderPattern, value || "");
        }
      }
    });

    // 3. ⚡ NOVA ETAPA: Limpar placeholders de campos OCULTOS ou NÃO EXISTENTES
    // Encontrar todos os placeholders remanescentes no template
    const placeholderRegex = /\[([a-zA-Z0-9_-]+)\]/g;
    const remainingPlaceholders = new Set<string>();
    let match;

    while ((match = placeholderRegex.exec(filledTemplate)) !== null) {
      remainingPlaceholders.add(match[1]);
    }

    // Para cada placeholder remanescente, verificar se é de campo oculto ou inexistente
    remainingPlaceholders.forEach((fieldId) => {
      // Ignorar placeholders especiais do sistema
      if (["city", "state", "signing-date"].includes(fieldId)) return;

      const field = selectedTemplate.fields.find((f) => f.id === fieldId);
      const isHidden = field && !visibleFieldIds.has(fieldId);
      const doesNotExist = !field;

      if (isHidden || doesNotExist) {
        const escapedFieldId = fieldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

        // Se campo opcional ou oculto, remover linha inteira
        if ((field && !field.required) || isHidden) {
          const lineRemovalPattern = new RegExp(`^.*\\[${escapedFieldId}\\].*\\n?`, "gm");
          filledTemplate = filledTemplate.replace(lineRemovalPattern, "");
          console.log(`[PLACEHOLDER-CLEANUP] Removendo linha de campo oculto/opcional: ${fieldId}`);
        } else {
          // Campo obrigatório mas não existe - substituir por vazio (evitar quebra)
          const placeholderPattern = new RegExp(`\\[${escapedFieldId}\\]`, "g");
          filledTemplate = filledTemplate.replace(placeholderPattern, "");
          console.log(`[PLACEHOLDER-CLEANUP] Removendo placeholder de campo inexistente: ${fieldId}`);
        }
      }
    });

    // 4. Replace location and date placeholders
    filledTemplate = filledTemplate.replace(/\[city\]/g, locationData.city || "[city]");
    filledTemplate = filledTemplate.replace(/\[state\]/g, locationData.state || "[state]");
    filledTemplate = filledTemplate.replace(
      /\[signing-date\]/g,
      locationData.date ? formatDateToBrazilian(locationData.date) : "[signing-date]",
    );

    return filledTemplate;
  };

  // Manter fillContractTemplate para compatibilidade (aponta para preview)
  const fillContractTemplate = generatePreviewText;

  // Contract Persistence Functions
  const saveContract = async (name?: string, showToast: boolean = false): Promise<string | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !selectedTemplate) return null;

      const contractData: any = {
        user_id: user.id,
        template_id: selectedTemplate.id,
        name: name || `${selectedTemplate.name} - ${new Date().toLocaleDateString("pt-BR")}`,
        status: currentQuestionIndex === 9999 ? "completed" : "draft",
        form_values: formValues,
        parties_data: partiesData,
        number_of_parties: numberOfParties,
        other_parties_data: otherPartiesData,
        number_of_other_parties: numberOfOtherParties,
        has_other_parties: hasOtherParties,
        location_data: locationData,
        repeatable_fields_data: repeatableFieldsData,
        current_question_index: currentQuestionIndex,
        current_party_loop_index: currentPartyLoopIndex,
        generated_document: currentQuestionIndex === 9999 ? generateFinalDocument() : null,
        last_accessed_at: new Date().toISOString(),
      };

      // Only include ID for existing contracts (updates)
      if (currentSavedContractId) {
        contractData.id = currentSavedContractId;
      }

      const { data, error } = await supabase.from("saved_contracts").upsert([contractData]).select().single();

      if (error) throw error;

      if (data) {
        setCurrentSavedContractId(data.id);

        // Show toast only if explicitly requested (for manual saves)
        if (showToast) {
          toast.success("Contrato salvo com sucesso!");
        }

        return data.id;
      }

      return null;
    } catch (error) {
      console.error("Erro ao salvar contrato:", error);
      toast.error("Erro ao salvar contrato");
      return null;
    }
  };

  const loadContract = async (contractId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("saved_contracts")
        .select("*, contract_templates(*)")
        .eq("id", contractId)
        .single();

      if (error || !data) {
        toast.error("Erro ao carregar contrato");
        return false;
      }

      if (!data.contract_templates) {
        console.error("Template não encontrado para o contrato:", contractId);
        toast.error("Erro: O modelo original deste contrato não foi encontrado.");
        return false;
      }

      const templateData = data.contract_templates as any;

      // Garantir que os campos tenham display_order e estejam ordenados
      const fields = (templateData.fields as ContractField[] || []).map((field, index) => ({
        ...field,
        display_order: field.display_order ?? index,
      }));

      const processedTemplate: ContractTemplate = {
        ...templateData,
        fields: sortFieldsByDisplayOrder(fields),
        usePartySystem: templateData.use_party_system
      };

      // Restaurar estado completo
      setSelectedTemplate(processedTemplate);
      setFormValues((data.form_values || {}) as any);
      setPartiesData((data.parties_data || []) as any);
      setNumberOfParties(data.number_of_parties || 0);
      setOtherPartiesData((data.other_parties_data || []) as any);
      setNumberOfOtherPartiesState(data.number_of_other_parties || 0);
      setHasOtherParties(data.has_other_parties || false);
      setLocationData(
        (data.location_data || { city: "", state: "", date: new Date().toISOString().split("T")[0] }) as any,
      );
      setRepeatableFieldsData((data.repeatable_fields_data || []) as any);
      // Contracts that have been reviewed should always open at the summary
      const restoredIndex = (
        (data as any).status === 'rejected' || (data as any).status === 'pending_review'
      ) ? 9999 : (data.current_question_index || -1);
      setCurrentQuestionIndex(restoredIndex);
      setCurrentPartyLoopIndex(data.current_party_loop_index || 0);
      setCurrentSavedContractId(contractId);
      setCurrentContractStatus((data as any).status || null);
      setCurrentContractReviewNotes((data as any).review_notes || null);
      setCurrentContractReviewedAt((data as any).reviewed_at || null);
      setCurrentContractOrganizationId((data as any).organization_id || null);
      setIsQuestionnaireMode(true);

      toast.success("Contrato carregado com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao carregar contrato:", error);
      toast.error("Erro ao carregar contrato");
      return false;
    }
  };

  const resubmitForReview = async (): Promise<boolean> => {
    if (!currentSavedContractId) return false;
    try {
      const finalDoc = generateFinalDocument();
      const parties = getContractingParties();
      const otherInvolved = getOtherInvolved();
      const signatures = getSignatures();
      const locationDate = getLocationDate();
      const fullDocument = [
        parties ? `PARTES PRINCIPAIS\n\n${parties}` : '',
        otherInvolved ? `OUTROS ENVOLVIDOS\n\n${otherInvolved}` : '',
        finalDoc,
        locationDate ? `\n${locationDate}` : '',
        signatures ? `ASSINATURAS\n\n${signatures}` : '',
      ].filter(Boolean).join('\n\n');

      const { error } = await supabase
        .from('saved_contracts')
        .update({
          status: 'pending_review',
          submitted_for_review_at: new Date().toISOString(),
          generated_document: fullDocument,
        })
        .eq('id', currentSavedContractId);

      if (error) throw error;
      setCurrentContractStatus('pending_review');
      toast.success('Documento reenviado para revisão!');
      return true;
    } catch (error: any) {
      toast.error('Erro ao reenviar para revisão: ' + error.message);
      return false;
    }
  };

  const listUserContracts = async (): Promise<SavedContract[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("saved_contracts")
        .select("id, name, status, template_id, updated_at, organization_id, review_notes, reviewed_at, contract_templates(name)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data as SavedContract[]) || [];
    } catch (error) {
      console.error("Erro ao listar contratos:", error);
      return [];
    }
  };

  const deleteContract = async (contractId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("saved_contracts").delete().eq("id", contractId);

      if (error) throw error;

      toast.success("Contrato excluído com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao excluir contrato:", error);
      toast.error("Erro ao excluir contrato");
      return false;
    }
  };

  const addCustomTemplate = async (template: ContractTemplate) => {
    console.log("Adding custom template:", template);
    const templateWithVersion = initializeTemplateVersion(template);

    try {
      // Converter camelCase para snake_case para o Supabase
      const supabaseTemplate = {
        ...templateWithVersion,
        use_party_system: templateWithVersion.usePartySystem,
      };
      delete (supabaseTemplate as any).usePartySystem;

      const { data, error } = await supabase
        .from("contract_templates")
        .insert([supabaseTemplate as any])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newTemplate = {
          ...data[0],
          fields: data[0].fields as any as ContractField[],
          version: data[0].version as any,
        } as ContractTemplate;
        setCustomTemplates((prev) => [...prev, newTemplate]);
        toast.success("Template adicionado com sucesso!");
        console.log("Custom templates after add:", newTemplate);
      }
    } catch (error) {
      console.error("Erro ao adicionar template:", error);
      toast.error("Erro ao adicionar template");
    }
  };

  const updateCustomTemplate = async (id: string, template: ContractTemplate) => {
    console.log("Updating custom template:", id, template);
    const templateWithVersion = updateTemplateVersion(template);

    try {
      const { error } = await supabase
        .from("contract_templates")
        .update(templateWithVersion as any)
        .eq("id", id);

      if (error) throw error;

      setCustomTemplates((prev) => prev.map((t) => (t.id === id ? templateWithVersion : t)));
      toast.success("Template atualizado com sucesso!");
      console.log("Custom templates after update");
    } catch (error) {
      console.error("Erro ao atualizar template:", error);
      toast.error("Erro ao atualizar template");
    }
  };

  const deleteCustomTemplate = async (id: string) => {
    console.log("Deleting custom template:", id);

    try {
      const { error } = await supabase.from("contract_templates").delete().eq("id", id);

      if (error) throw error;

      setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template deletado com sucesso!");
      console.log("Custom templates after delete");
    } catch (error) {
      console.error("Erro ao deletar template:", error);
      toast.error("Erro ao deletar template");
    }
  };

  const renameTemplate = async (id: string, newName: string) => {
    console.log("[RENAME] Renomeando template:", { id, newName });

    try {
      const template = customTemplates.find((t) => t.id === id);
      if (!template) {
        toast.error("Template não encontrado");
        return;
      }

      const oldName = template.name;

      const { error } = await supabase.from("contract_templates").update({ name: newName }).eq("id", id);

      if (error) throw error;

      // Atualizar estado local
      setCustomTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, name: newName } : t)));

      // Se o template sendo renomeado é o selecionado, atualizar também
      if (selectedTemplate && selectedTemplate.id === id) {
        setSelectedTemplate((prev) => (prev ? { ...prev, name: newName } : null));
      }

      // Se o template sendo renomeado está sendo editado, atualizar também
      if (editingTemplate && editingTemplate.id === id) {
        setEditingTemplate((prev) => (prev ? { ...prev, name: newName } : null));
      }

      toast.success(`Template renomeado com sucesso!`);
      console.log("[RENAME] Template renomeado:", { id, oldName, newName });
    } catch (error) {
      console.error("[RENAME] Erro ao renomear template:", error);
      toast.error("Erro ao renomear template");
    }
  };

  const startEditingTemplate = (template: ContractTemplate) => {
    console.log("Starting to edit template:", template);
    const templateWithVersion = initializeTemplateVersion(template);
    setEditingTemplate(templateWithVersion);
  };

  const finishEditingTemplate = () => {
    console.log("Finishing template editing");
    setEditingTemplate(null);
  };

  const saveEditingTemplate = (template: ContractTemplate) => {
    console.log("Saving edited template:", template);

    const templateWithVersion = updateTemplateVersion(template);

    // Check if this template exists in custom templates
    const existingIndex = customTemplates.findIndex((t) => t.id === template.id);

    if (existingIndex !== -1) {
      // Update existing template
      console.log("Updating existing template");
      updateCustomTemplate(template.id, templateWithVersion);
    } else {
      // Add as new template
      console.log("Adding new template");
      addCustomTemplate(templateWithVersion);
    }

    // If the edited template is currently selected, update it
    if (selectedTemplate && selectedTemplate.id === template.id) {
      setSelectedTemplate(templateWithVersion);
    }

    // Clear editing state
    setEditingTemplate(null);
    console.log("Template saved successfully");
  };

  const updateSelectedTemplateField = (fieldIndex: number, updatedField: any) => {
    if (!selectedTemplate) return;

    console.log("Updating selected template field:", fieldIndex, updatedField);

    const updatedFields = [...selectedTemplate.fields];
    updatedFields[fieldIndex] = updatedField;

    const updatedTemplate = updateTemplateVersion({
      ...selectedTemplate,
      fields: updatedFields,
    });

    // Update the template in the appropriate storage
    if (selectedTemplate.id.startsWith("custom-")) {
      updateCustomTemplate(selectedTemplate.id, updatedTemplate);
    } else {
      // For original templates, we now update them directly instead of creating copies
      // But since original templates come from contractTemplates.ts, we need to store them as custom
      const customTemplate = {
        ...updatedTemplate,
        id: selectedTemplate.id, // Keep the same ID
      };

      // Check if it already exists in custom templates
      const existingIndex = customTemplates.findIndex((t) => t.id === selectedTemplate.id);
      if (existingIndex !== -1) {
        updateCustomTemplate(selectedTemplate.id, customTemplate);
      } else {
        addCustomTemplate(customTemplate);
      }
    }

    // Update the selected template immediately
    setSelectedTemplate(updatedTemplate);
    console.log("Selected template field updated successfully");
  };

  // Party system functions
  const handleSetNumberOfParties = (count: number) => {
    setNumberOfParties(count);
    // Initialize empty party data array
    const initialParties: PartyData[] = Array.from({ length: count }, (_, index) => ({
      id: `party-${index}`,
      fullName: "",
      nationality: "",
      maritalStatus: "",
      profession: "",
      cpf: "",
      email: "",
      address: "",
      city: "",
      state: "",
      partyType: "Contratante",
      category: "main" as const,
      personType: "PF" as const, // ✅ v3.2: Padrão PF
      hasRepresentative: false,
      representativeName: "",
      representativeRole: "",
      representativeCpf: "",
    }));
    setPartiesData(initialParties);
    setCurrentPartyIndex(0);
  };

  const handleSetNumberOfOtherParties = (count: number) => {
    setNumberOfOtherPartiesState(count);
    // Initialize empty other party data array
    const initialOtherParties: PartyData[] = Array.from({ length: count }, (_, index) => ({
      id: `other-party-${index}`,
      fullName: "",
      nationality: "",
      maritalStatus: "",
      profession: "",
      cpf: "",
      email: "",
      address: "",
      city: "",
      state: "",
      partyType: "Testemunha",
      category: "other" as const,
      personType: "PF" as const, // ✅ v3.2: Padrão PF
      hasRepresentative: false,
      representativeName: "",
      representativeRole: "",
      representativeCpf: "",
    }));
    setOtherPartiesData(initialOtherParties);
  };

  const updatePartyData = (index: number, data: PartyData, isOther: boolean = false) => {
    if (isOther) {
      setOtherPartiesData((prev) => {
        const updated = [...prev];
        updated[index] = data;
        return updated;
      });
    } else {
      setPartiesData((prev) => {
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
        .from("party_types")
        .insert([
          {
            name: typeData.name,
            category: typeData.category,
            description: typeData.description,
            is_default: false,
            display_order: maxOrder + 1,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setPartyTypes([...partyTypes, data]);
      toast.success(`Tipo "${data.name}" adicionado com sucesso!`);
    } catch (error) {
      console.error("Erro ao adicionar tipo de parte:", error);
      toast.error("Erro ao adicionar tipo de parte");
    }
  };

  // ✅ v3.2: Formatação de qualificação com suporte a PF/PJ
  const formatPartyQualification = (party: PartyData): string => {
    const personType = party.personType || "PF"; // Retrocompatibilidade

    if (personType === "PJ") {
      // ========== PESSOA JURÍDICA ==========
      let qualification = `**${party.fullName.toUpperCase()}**, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${party.cpf}, com sede em ${party.address}, ${party.city}, ${party.state}`;

      if (party.email) {
        qualification += `, e-mail ${party.email}`;
      }

      // Representante Legal
      if (party.hasRepresentative && party.representativeName) {
        qualification += `, neste ato representada por **${party.representativeName.toUpperCase()}**, ${party.representativeRole || "representante legal"}, inscrito(a) no CPF sob o nº ${party.representativeCpf}`;
      }

      qualification += `, na qualidade de **${party.partyType.toUpperCase()}**.`;
      return qualification;
    }

    // ========== PESSOA FÍSICA (comportamento original) ==========
    let qualification = `**${party.fullName.toUpperCase()}**, ${party.nationality}, ${party.maritalStatus}`;

    if (party.profession) {
      qualification += `, ${party.profession}`;
    }

    qualification += `, inscrito(a) no CPF sob o nº ${party.cpf}, residente e domiciliado(a) na ${party.address}, ${party.city}, ${party.state}`;

    if (party.email) {
      qualification += `, e-mail ${party.email}`;
    }

    qualification += `, na qualidade de **${party.partyType.toUpperCase()}**.`;

    return qualification;
  };

  const getContractingParties = (): string => {
    if (partiesData.length === 0) return "";

    const qualifications = partiesData.map(formatPartyQualification);
    return qualifications.join("\n\n");
  };

  const getOtherInvolved = (): string => {
    if (otherPartiesData.length === 0) return "";

    const qualifications = otherPartiesData.map(formatPartyQualification);
    return "\n\nE AINDA:\n\n" + qualifications.join("\n\n");
  };

  // ✅ v3.2: Formatação de bloco de assinatura com suporte a PF/PJ
  const formatSignatureBlock = (party: PartyData): string => {
    const personType = party.personType || "PF"; // Retrocompatibilidade

    if (personType === "PJ") {
      if (party.hasRepresentative && party.representativeName) {
        // PJ com representante
        return `_________________________\n${party.fullName}\nCNPJ: ${party.cpf}\nNeste ato representada por: ${party.representativeName}\nCPF: ${party.representativeCpf}\n${party.partyType}`;
      }
      // PJ sem representante
      return `_________________________\n${party.fullName}\nCNPJ: ${party.cpf}\n${party.partyType}`;
    }

    // PF (comportamento original)
    return `_________________________\n${party.fullName}\nCPF: ${party.cpf}\n${party.partyType}`;
  };

  const getSignatures = (): string => {
    const allParties = [...partiesData, ...otherPartiesData];
    if (allParties.length === 0) return "";

    const signatures = allParties.map(formatSignatureBlock);
    return signatures.join("\n\n");
  };

  const updateLocationDataFunc = (field: string, value: string) => {
    setLocationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getLocationDate = (): string => {
    if (!locationData.city || !locationData.state || !locationData.date) return "";

    const formattedDate = formatDateToBrazilian(locationData.date);
    return `${locationData.city}, ${locationData.state}, ${formattedDate}`;
  };

  const downloadPDF = async () => {
    if (!selectedTemplate) {
      toast.error("Nenhum modelo selecionado");
      return;
    }
    
    const contractText = generateFinalDocument();
    const fileName = selectedTemplate.name || "Contrato";
    
    toast.promise(generatePDF(fileName, contractText), {
      loading: 'Gerando PDF...',
      success: 'PDF baixado com sucesso!',
      error: 'Erro ao gerar PDF'
    });
  };

  return (
    <ContractContext.Provider
      value={{
        selectedTemplate,
        formValues,
        currentQuestionIndex,
        currentPartyLoopIndex,
        isQuestionnaireMode,
        customTemplates,
        isLoadingTemplates,
        editingTemplate,
        isEditingFromSummary,
        currentSavedContractId,
        getAllVisibleFieldsSorted,
        selectTemplate,
        updateFormValue,
        resetForm,
        fillContractTemplate,
        generatePreviewText,
        generateFinalDocument,
        nextQuestion,
        previousQuestion,
        goToQuestion,
        saveAndReturnToSummary,
        startQuestionnaire,
        finishQuestionnaire,
        addCustomTemplate,
        updateCustomTemplate,
        deleteCustomTemplate,
        renameTemplate,
        startEditingTemplate,
        finishEditingTemplate,
        saveEditingTemplate,
        updateSelectedTemplateField,
        numberOfParties,
        partiesData,
        currentPartyIndex,
        numberOfOtherParties,
        otherPartiesData,
        hasOtherParties,
        updateHasOtherParties,
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
        saveContract,
        loadContract,
        listUserContracts,
        deleteContract,
        downloadPDF,
        currentContractStatus,
        currentContractReviewNotes,
        currentContractReviewedAt,
        currentContractOrganizationId,
        resubmitForReview,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = (): ContractContextType => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return context;
};
