
import React from 'react';
import { ContractProvider } from '../contexts/ContractContext';
import Navbar from '../components/Navbar';
import TemplateSelector from '../components/TemplateSelector';
import ContractForm from '../components/ContractForm';
import QuestionnaireForm from '../components/QuestionnaireForm';
import ContractPreview from '../components/ContractPreview';
import { useContract } from '../contexts/ContractContext';

// Main content with conditional rendering based on template selection
const ContractContent = () => {
  const { selectedTemplate, isQuestionnaireMode } = useContract();

  if (!selectedTemplate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-contractPrimary mb-4">Gerador de Contratos Inteligente</h1>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Crie contratos personalizados em minutos. Escolha um modelo, preencha os campos e receba seu documento pronto para uso.
            </p>
          </div>
          
          <div className="bg-gray-50 py-12 rounded-lg">
            <TemplateSelector />
          </div>
          
          <div id="about" className="py-12 mt-12 border-t border-gray-100">
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
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2 print:hidden">
            <QuestionnaireForm />
          </div>
          <div className="md:w-1/2 print:w-full">
            <ContractPreview />
          </div>
        </div>
      </div>
    );
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
    <ContractProvider>
      <div className="min-h-screen bg-white flex flex-col print:bg-white">
        <div className="print:hidden">
          <Navbar />
        </div>
        <ContractContent />
      </div>
    </ContractProvider>
  );
};

export default Index;
