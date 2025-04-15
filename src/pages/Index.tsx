
import React from 'react';
import { ContractProvider } from '../contexts/ContractContext';
import Navbar from '../components/Navbar';
import TemplateSelector from '../components/TemplateSelector';
import ContractForm from '../components/ContractForm';
import ContractPreview from '../components/ContractPreview';
import { useContract } from '../contexts/ContractContext';

// Main content with conditional rendering based on template selection
const ContractContent = () => {
  const { selectedTemplate } = useContract();

  if (!selectedTemplate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-contractPrimary mb-2">Gerador de Contratos Online</h1>
            <p className="text-gray-600 text-lg">
              Crie contratos personalizados em minutos. Escolha um modelo, preencha os campos e imprima seu documento pronto para uso.
            </p>
          </div>
          
          <TemplateSelector />
          
          <div id="about" className="py-8 border-t border-gray-200 mt-8">
            <h2 className="text-2xl font-bold mb-4 text-contractPrimary">Sobre o Legal Journey</h2>
            <p className="text-gray-600 mb-4">
              O Legal Journey é uma ferramenta online que permite a criação de contratos profissionais de forma rápida e segura.
              Nossos modelos são desenvolvidos por especialistas e são atualizados regularmente para atender às mudanças na legislação.
            </p>
            <p className="text-gray-600">
              Importante: Os contratos gerados por esta ferramenta são modelos genéricos que podem necessitar de adaptação
              para sua situação específica. Recomendamos a revisão por um profissional antes da assinatura.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen bg-gray-50 flex flex-col print:bg-white">
        <div className="print:hidden">
          <Navbar />
        </div>
        <ContractContent />
      </div>
    </ContractProvider>
  );
};

export default Index;
