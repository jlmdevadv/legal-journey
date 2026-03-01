
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TemplateSelector from '../components/TemplateSelector';
import ContractForm from '../components/ContractForm';
import QuestionnaireForm from '../components/QuestionnaireForm';
import ContractPreview from '../components/ContractPreview';
import TemplateEditor from '../components/admin/TemplateEditor';
import { useContract } from '../contexts/ContractContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoSave } from '@/hooks/useAutoSave';
import { HelpCircle, Info, PlayCircle, Bot, ChevronDown, ChevronUp, BookOpen, GraduationCap, Users, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReviewFeedbackPanel from '@/components/shared/ReviewFeedbackPanel';

// Questionnaire with auto-save
const QuestionnaireWithAutoSave = () => {
  const { user } = useAuth();
  const {
    saveContract,
    currentQuestionIndex,
    selectedTemplate,
    formValues,
    partiesData,
    otherPartiesData,
    locationData,
    repeatableFieldsData,
    currentContractStatus,
    currentContractReviewNotes,
    currentContractReviewedAt,
    currentSavedContractId,
    resubmitForReview,
  } = useContract();

  // Enable auto-save when user is logged in (including summary screen)
  const shouldAutoSave = user && currentQuestionIndex >= -2;

  const { isSaving, lastSaved } = useAutoSave({
    onSave: async () => {
      if (!selectedTemplate) return;
      await saveContract();
    },
    interval: 30000, // 30 seconds
    enabled: shouldAutoSave
  });

  // Save on card change
  const prevIndexRef = React.useRef(currentQuestionIndex);
  React.useEffect(() => {
    const prevIndex = prevIndexRef.current;
    const currentIndex = currentQuestionIndex;
    
    // Save when index changes and auto-save is enabled
    if (prevIndex !== currentIndex && shouldAutoSave && prevIndex !== -1) {
      console.log('[SAVE-ON-CHANGE] Salvando ao mudar de pergunta...');
      saveContract();
    }
    
    prevIndexRef.current = currentIndex;
  }, [currentQuestionIndex, shouldAutoSave, saveContract]);

  const isRejected = currentContractStatus === 'rejected';

  const handleResubmit = async () => {
    await resubmitForReview();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 print:hidden">
          <QuestionnaireForm
            isSharedContext={isRejected}
            onSubmitForReview={isRejected ? handleResubmit : undefined}
          />
          
          {/* Auto-save indicator */}
          {user && (
            <div className="mt-2 flex items-center justify-end text-xs text-muted-foreground">
              {isSaving ? (
                <>
                  <Save className="w-3 h-3 mr-1 animate-pulse" />
                  <span>Salvando...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  <span>Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              ) : null}
            </div>
          )}
        </div>
        <div className="md:w-1/2 print:w-full">
          <div className="sticky top-6">
            <ScrollArea className="h-[calc(100vh-8rem)]" data-contract-preview-scroll>
              <ContractPreview />
            </ScrollArea>
          </div>
        </div>
      </div>
      {isRejected && currentContractReviewNotes && currentSavedContractId && (
        <ReviewFeedbackPanel
          reviewNotes={currentContractReviewNotes}
          reviewedAt={currentContractReviewedAt}
          contractId={currentSavedContractId}
        />
      )}
    </div>
  );
};

// FAQ data
const faqData = [
  {
    question: "Como funciona o Legal Journey?",
    answer: "O Legal Journey é uma plataforma que permite criar contratos personalizados em poucos minutos. Você escolhe um modelo, responde às perguntas guiadas e recebe seu documento pronto para uso."
  },
  {
    question: "Os contratos gerados são juridicamente válidos?",
    answer: "Nossos modelos são desenvolvidos por especialistas jurídicos, mas recomendamos sempre a revisão por um advogado antes da assinatura, pois cada situação pode ter particularidades específicas."
  },
  {
    question: "Posso salvar e editar meus contratos depois?",
    answer: "Sim! Você pode salvar seus contratos em formato PDF e também voltar para editar os campos preenchidos a qualquer momento durante o processo de criação."
  },
  {
    question: "O que são os GPTs personalizados?",
    answer: "São assistentes de IA treinados especificamente para cada tipo de contrato, que podem te ajudar a entender melhor como preencher campos complexos ou esclarecer dúvidas jurídicas."
  },
  {
    question: "A plataforma é gratuita?",
    answer: "Oferecemos funcionalidades básicas gratuitas. Para recursos avançados como GPTs personalizados e modelos premium, consulte nossos planos pagos."
  },
  {
    question: "Como posso ter certeza de que meus dados estão seguros?",
    answer: "Utilizamos criptografia de ponta e não armazenamos permanentemente os dados dos seus contratos. Toda informação é processada de forma segura e confidencial."
  }
];

// Main content with conditional rendering based on template selection
const ContractContent = () => {
  const { 
    selectedTemplate, 
    isQuestionnaireMode, 
    editingTemplate, 
    finishEditingTemplate, 
    saveEditingTemplate,
    saveContract,
    currentQuestionIndex,
    selectTemplate,
    customTemplates,
    isLoadingTemplates
  } = useContract();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openFaqItems, setOpenFaqItems] = useState<Set<number>>(new Set());

  // Auto-select template after login redirect
  useEffect(() => {
    const locationState = location.state as { autoSelectTemplateId?: string } | null;
    
    if (locationState?.autoSelectTemplateId && user && !isLoadingTemplates && customTemplates.length > 0) {
      const templateToSelect = customTemplates.find(
        t => t.id === locationState.autoSelectTemplateId
      );
      
      if (templateToSelect) {
        navigate('/', { replace: true, state: {} });
        toast.success(`Continuando com: ${templateToSelect.name}`);
        selectTemplate(templateToSelect);
      }
    }
  }, [location.state, user, customTemplates, isLoadingTemplates]);

  const toggleFaqItem = (index: number) => {
    const newOpenItems = new Set(openFaqItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenFaqItems(newOpenItems);
  };

  // Show template editor if editing
  if (editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onSave={saveEditingTemplate}
        onCancel={finishEditingTemplate}
      />
    );
  }

  if (!selectedTemplate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <h1 className="font-serif text-4xl text-foreground font-normal mb-4">Gerador de Contratos Inteligente</h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Crie contratos personalizados em minutos. Escolha um modelo, preencha os campos e receba seu documento pronto para uso.
            </p>
          </div>

          {/* Educational Differential Section */}
          <div className="mb-12 py-12 bg-surface-secondary rounded border border-border">
            <div className="max-w-4xl mx-auto px-6">
              <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h2 className="font-serif text-3xl text-foreground font-normal mb-4">
                  Por que Legal Journey?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Uma jornada educacional completa no mundo jurídico
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="hover:bg-surface-secondary transition-colors">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-base">Orientação Inteligente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Cada campo possui explicações detalhadas de como preencher e por que é importante para seu contrato.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="hover:bg-surface-secondary transition-colors">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <PlayCircle className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-base">Vídeos Explicativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Assista vídeos curtos e didáticos que esclarecem conceitos jurídicos complexos de forma simples.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="hover:bg-surface-secondary transition-colors">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-base">GPTs Personalizados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Acesse assistentes de IA treinados especificamente para cada tipo de contrato e situação jurídica.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center mt-8">
                <p className="text-muted-foreground italic">
                  "Não apenas geramos contratos, mas educamos você sobre cada etapa do processo"
                </p>
              </div>
            </div>
          </div>
          
          {/* Template Selector */}
          <div className="bg-surface-secondary py-12 rounded border border-border mb-12">
            <TemplateSelector />
          </div>

          {/* FAQ Section */}
          <div className="py-12 mb-12">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <HelpCircle className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="font-serif text-3xl text-foreground font-normal mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-muted-foreground text-lg">
                Tire suas dúvidas sobre nossa plataforma
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqData.map((faq, index) => (
                <Card key={index}>
                  <Collapsible
                    open={openFaqItems.has(index)}
                    onOpenChange={() => toggleFaqItem(index)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="hover:bg-surface-secondary cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base text-left">
                            {faq.question}
                          </CardTitle>
                          {openFaqItems.has(index) ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </div>
          
          {/* About Section */}
          <div id="about" className="py-12 border-t border-border">
            <h2 className="font-serif text-3xl text-foreground font-normal mb-6">Sobre o Legal Journey</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-muted-foreground mb-4">
                  O Legal Journey é uma ferramenta online que permite a criação de contratos profissionais de forma rápida e segura.
                  Nossos modelos são desenvolvidos por especialistas e são atualizados regularmente para atender às mudanças na legislação.
                </p>
                <p className="text-muted-foreground">
                  Utilizamos tecnologia avançada para garantir que seus documentos estejam sempre em conformidade com as leis vigentes.
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-4">
                  Importante: Os contratos gerados por esta ferramenta são modelos genéricos que podem necessitar de adaptação
                  para sua situação específica. Recomendamos a revisão por um profissional antes da assinatura.
                </p>
                <p className="text-muted-foreground">
                  Para mais informações sobre nossos serviços ou para solicitar assistência personalizada, entre em contato conosco.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show questionnaire mode (one question at a time)
  if (isQuestionnaireMode || selectedTemplate.fields.length > 0) {
    return <QuestionnaireWithAutoSave />;
  }

  // Fallback to old form (shouldn't normally reach here)
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 print:hidden">
          <ContractForm />
        </div>
        <div className="md:w-1/2 print:w-full">
          <ContractPreview />
        </div>
      </div>
    </div>
  );
};

// Index page component
const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>
      <ContractContent />
    </div>
  );
};

export default Index;
