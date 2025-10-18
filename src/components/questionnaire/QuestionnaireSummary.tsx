import React, { useState } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Edit, Printer } from 'lucide-react';
import DocumentDownloader from '../DocumentDownloader';
import ContractPreviewModal from '../ContractPreviewModal';

const QuestionnaireSummary = () => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { 
    selectedTemplate, 
    formValues, 
    previousQuestion, 
    goToQuestion, 
    finishQuestionnaire,
    fillContractTemplate,
    getContractingParties,
    getOtherInvolved,
    getSignatures,
    locationData,
    getLocationDate
  } = useContract();

  if (!selectedTemplate) return null;

  const handlePrint = () => {
    finishQuestionnaire();
    setTimeout(() => window.print(), 100);
  };

  const getDocumentData = () => ({
    title: selectedTemplate.name,
    content: fillContractTemplate(),
    parties: getContractingParties(),
    otherInvolved: getOtherInvolved(),
    signatures: getSignatures(),
    locationDate: getLocationDate()
  });

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-contractPrimary mb-2">
            Questionário Concluído!
          </CardTitle>
          <p className="text-gray-600">
            Revise suas respostas abaixo. Você pode editar qualquer informação antes de finalizar.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Location and Date Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Local e Data do Contrato</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cidade:</span>
                <span className="font-medium">{locationData.city || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium">{locationData.state || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">
                  {locationData.date ? new Date(locationData.date).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {selectedTemplate.fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{field.label}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => goToQuestion(index)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-gray-700 bg-gray-50 p-2 rounded">
                  {formValues[field.id] || <span className="text-gray-400 italic">Não preenchido</span>}
                </p>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Próximos passos</h3>
            <p className="text-sm text-blue-700 mb-3">
              Seu contrato está pronto! Você pode visualizá-lo, imprimi-lo ou baixá-lo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setShowPreviewModal(true)}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Visualizar Contrato
              </Button>
              <Button 
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              <DocumentDownloader
                documentData={getDocumentData()}
                filename={selectedTemplate.name}
                elementId="contract-preview"
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              />
            </div>
          </div>
          
          <div className="flex justify-start">
            <Button 
              variant="outline" 
              onClick={previousQuestion}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar à última pergunta
            </Button>
          </div>
        </CardContent>
      </Card>

      <ContractPreviewModal 
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </div>
  );
};

export default QuestionnaireSummary;
