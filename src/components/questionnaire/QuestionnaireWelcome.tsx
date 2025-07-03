
import React from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';

const QuestionnaireWelcome = () => {
  const { selectedTemplate, startQuestionnaire, resetForm } = useContract();

  if (!selectedTemplate) return null;

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-contractPrimary mb-2">
            {selectedTemplate.name}
          </CardTitle>
          <p className="text-gray-600">
            {selectedTemplate.description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Como funciona?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Vamos fazer {selectedTemplate.fields.length} perguntas simples</li>
              <li>• Cada pergunta aparece individualmente</li>
              <li>• Você pode voltar e editar suas respostas a qualquer momento</li>
              <li>• No final, seu contrato estará pronto para imprimir ou baixar</li>
            </ul>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={resetForm}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar aos modelos
            </Button>
            
            <Button 
              onClick={startQuestionnaire}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              Começar questionário
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionnaireWelcome;
