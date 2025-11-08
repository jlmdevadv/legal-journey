import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useContract } from '@/contexts/ContractContext';
import { ContractField } from '@/types/template';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import QuestionnaireHelp from './QuestionnaireHelp';
import AnswerTemplatesSelector from './AnswerTemplatesSelector';

interface RepeatableFieldCardProps {
  field: ContractField;
  partyId: string;
  partyName: string;
  partyIndex: number;
  totalParties: number;
  fieldIndex: number;
  totalFields: number;
  isLastField: boolean;
  isLastParty: boolean;
}

const RepeatableFieldCard = ({
  field,
  partyId,
  partyName,
  partyIndex,
  totalParties,
  fieldIndex,
  totalFields,
  isLastField,
  isLastParty
}: RepeatableFieldCardProps) => {
  const { 
    getRepeatableFieldValue, 
    updateRepeatableFieldValue, 
    previousQuestion,
    nextQuestion,
    isEditingFromSummary,
    saveAndReturnToSummary,
    currentQuestionIndex // ✅ NOVO v3.0 - para calcular progresso correto
  } = useContract();

  const inputRef = useRef<HTMLInputElement>(null);
  const currentValue = getRepeatableFieldValue(field.id, partyId);
  const [localValue, setLocalValue] = useState(currentValue);
  
  // Sincronizar valor local com o valor do contexto
  useEffect(() => {
    setLocalValue(currentValue);
  }, [currentValue, field.id, partyId]);
  
  // ✅ NOVO v3.0: Progress baseado no índice global unificado
  const progress = ((currentQuestionIndex + 1) / totalFields) * 100;

  useEffect(() => {
    inputRef.current?.focus();
  }, [partyId, field.id]);

  const handleValueChange = (value: string) => {
    setLocalValue(value);
    updateRepeatableFieldValue(field.id, partyId, value);
  };

  // Sincronizar localValue quando o valor muda externamente
  useEffect(() => {
    setLocalValue(currentValue);
  }, [currentValue]);

  const handleNext = () => {
    if (field.required && !localValue.trim()) return;
    nextQuestion();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && field.type !== 'textarea') {
      handleNext();
    }
  };

  const canProceed = !field.required || localValue.trim() !== '';

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Parte {partyIndex + 1} de {totalParties} • Campo {fieldIndex + 1} de {totalFields}
          </span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="mb-4" />
        <CardTitle className="text-2xl">
          {field.label}
          {partyName && (
            <span className="block text-lg text-primary mt-2">
              de: {partyName}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {field.type === 'textarea' ? (
          <>
            <Textarea
              ref={inputRef as any}
              value={localValue}
              onChange={(e) => handleValueChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={field.placeholder}
              className="min-h-32"
            />
            {field.answerTemplates && field.answerTemplates.length > 0 && (
              <AnswerTemplatesSelector
                templates={field.answerTemplates}
                currentValue={localValue}
                mode={field.answerTemplateMode || 'replace'}
                onSelectTemplate={(value) => handleValueChange(value)}
              />
            )}
          </>
        ) : field.type === 'select' && field.options ? (
          <Select 
            value={localValue} 
            onValueChange={(value) => handleValueChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Selecione...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            ref={inputRef}
            type={field.type}
            value={localValue}
            onChange={(e) => handleValueChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={field.placeholder}
          />
        )}

        {field.required && !localValue.trim() && (
          <p className="text-sm text-destructive">Este campo é obrigatório</p>
        )}

        <QuestionnaireHelp field={field} />

        <div className="flex justify-between gap-2 pt-4">
          <Button
            variant="outline"
            onClick={previousQuestion}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>
          <Button
            onClick={() => {
              if (isEditingFromSummary) {
                saveAndReturnToSummary();
              } else {
                handleNext();
              }
            }}
            disabled={!canProceed}
            className="flex items-center gap-2"
          >
            {isEditingFromSummary 
              ? 'Salvar e Voltar ao Sumário' 
              : (isLastField && isLastParty ? 'Finalizar' : 'Próxima')
            }
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepeatableFieldCard;
