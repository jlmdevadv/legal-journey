import React from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { ContractField } from '@/types/template';

interface QuestionnaireInfoCardProps {
  field: ContractField;
  questionIndex: number;
  totalQuestions: number;
}

const QuestionnaireInfoCard: React.FC<QuestionnaireInfoCardProps> = ({
  field,
  questionIndex,
  totalQuestions
}) => {
  const { nextQuestion, previousQuestion } = useContract();

  console.log('[INFO-CARD] Renderizando card informativo:', field.id);

  // Formatar conteúdo com suporte a negrito e quebras de linha
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Suporte a **negrito**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className="mb-2 last:mb-0">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-500">
                Informação {questionIndex + 1} de {totalQuestions}
              </span>
            </div>
          </div>
          
          {field.label && (
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              {field.label}
            </CardTitle>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            {formatContent(field.infoContent || '')}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => previousQuestion()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <Button 
              onClick={() => nextQuestion()}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              Próxima
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionnaireInfoCard;
