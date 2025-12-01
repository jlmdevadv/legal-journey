
import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    repeatableFieldsData
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 print:hidden">
          <QuestionnaireForm />
          
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
    currentQuestionIndex
  } = useContract();
  const [openFaqItems, setOpenFaqItems] = useState<Set<number>>(new Set());

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
            <h1 className="text-4xl font-bold text-contractPrimary mb-4">Gerador de Contratos Inteligente</h1>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Crie contratos personalizados em minutos. Escolha um modelo, preencha os campos e receba seu documento pronto para uso.
            </p>
          </div>

          {/* Educational Differential Section */}
          <div className="mb-12 py-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div className="max-w-4xl mx-auto px-6">
              <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                  <div className="bg-contractPrimary/10 p-3 rounded-full">
                    <GraduationCap className="w-8 h-8 text-contractPrimary" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-contractPrimary mb-4">
                  Por que Legal Journey?
                </h2>
                <p className="text-gray-600 text-lg">
                  Uma jornada educacional completa no mundo jurídico
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="border-blue-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <HelpCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg text-contractPrimary">Orientação Inteligente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Cada campo possui explicações detalhadas de como preencher e por que é importante para seu contrato.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="border-green-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <PlayCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-lg text-contractPrimary">Vídeos Explicativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Assista vídeos curtos e didáticos que esclarecem conceitos jurídicos complexos de forma simples.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg text-contractPrimary">GPTs Personalizados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      Acesse assistentes de IA treinados especificamente para cada tipo de contrato e situação jurídica.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center mt-8">
                <p className="text-gray-600 italic">
                  "Não apenas geramos contratos, mas educamos você sobre cada etapa do processo"
                </p>
              </div>
            </div>
          </div>
          
          {/* Template Selector */}
          <div className="bg-gray-50 py-12 rounded-lg mb-12">
            <TemplateSelector />
          </div>

          {/* FAQ Section */}
          <div className="py-12 mb-12">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <div className="bg-contractPrimary/10 p-3 rounded-full">
                  <HelpCircle className="w-8 h-8 text-contractPrimary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-contractPrimary mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-gray-600 text-lg">
                Tire suas dúvidas sobre nossa plataforma
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqData.map((faq, index) => (
                <Card key={index} className="border-gray-200">
                  <Collapsible 
                    open={openFaqItems.has(index)} 
                    onOpenChange={() => toggleFaqItem(index)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-left text-contractPrimary">
                            {faq.question}
                          </CardTitle>
                          {openFaqItems.has(index) ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-gray-600">{faq.answer}</p>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </div>
          
          {/* About Section */}
          <div id="about" className="py-12 border-t border-gray-100">
            <h2 className="text-3xl font-bold mb-6 text-contractPrimary">Sobre o Legal Journey</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-600 mb-4 text-lg">
                  O Legal Journey é uma ferramenta online que permite a criação de contratos profissionais de forma rápida e segura.
                  Nossos modelos são desenvolvidos por especialistas e são atualizados regularmente para atender às mudanças na legislação.
                </p>
                <p className="text-gray-600 text-lg">
                  Utilizamos tecnologia avançada para garantir que seus documentos estejam sempre em conformidade com as leis vigentes.
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-4 text-lg">
                  Importante: Os contratos gerados por esta ferramenta são modelos genéricos que podem necessitar de adaptação
                  para sua situação específica. Recomendamos a revisão por um profissional antes da assinatura.
                </p>
                <p className="text-gray-600 text-lg">
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
    <div className="min-h-screen bg-white flex flex-col print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>
      <ContractContent />
    </div>
  );
};

export default Index;
