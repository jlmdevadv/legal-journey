
import React, { useEffect, useRef, useState } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import QuestionnaireHelp from './QuestionnaireHelp';
import FieldConfigModal from '../admin/FieldConfigModal';
import AnswerTemplatesSelector from './AnswerTemplatesSelector';

const QuestionnaireQuestion = () => {
  const { 
    selectedTemplate, 
    formValues, 
    currentQuestionIndex,
    isEditingFromSummary,
    updateFormValue, 
    nextQuestion, 
    previousQuestion,
    saveAndReturnToSummary,
    updateSelectedTemplateField,
    getAllVisibleFieldsSorted
  } = useContract();
  
  const { isAdmin } = useAuth();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localValue, setLocalValue] = useState('');

  // ✅ NOVO v3.0: Obter campo atual diretamente do array ordenado
  const allFields = getAllVisibleFieldsSorted();
  
  if (!selectedTemplate || currentQuestionIndex < 0 || currentQuestionIndex >= allFields.length) {
    return null;
  }

  const currentField = allFields[currentQuestionIndex];
  const currentValue = formValues[currentField.id] || '';
  const progress = ((currentQuestionIndex + 1) / allFields.length) * 100;
  const isLastQuestion = currentQuestionIndex === allFields.length - 1;
  const canProceed = !currentField.required || currentValue.trim() !== '';

  // Sincronizar valor local com formValues
  useEffect(() => {
    setLocalValue(currentValue);
  }, [currentValue, currentField.id]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestionIndex]);

  const handleValueChange = (value: string) => {
    setLocalValue(value);
    updateFormValue(currentField.id, value);
  };

  const handleNext = () => {
    if (canProceed) {
      nextQuestion();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentField.type !== 'textarea' && canProceed) {
      handleNext();
    }
  };

  const handleEditField = () => {
    setShowEditModal(true);
  };

  const handleFieldUpdate = (updatedField: any) => {
    console.log('Handling field update:', updatedField);
    updateSelectedTemplateField(currentQuestionIndex, updatedField);
    setShowEditModal(false);
  };

  return (
    <>
      <div className="min-h-[600px] flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Pergunta {currentQuestionIndex + 1} de {allFields.length}
              </span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditField}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </Button>
                )}
                <span className="text-sm font-medium text-blue-600">
                  {Math.round(progress)}% concluído
                </span>
              </div>
            </div>
            
            <Progress value={progress} className="mb-4" />
            
            <CardTitle className="text-xl text-contractPrimary">
              {currentField.label}
              {currentField.required && <span className="text-red-500 ml-1">*</span>}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              {currentField.type === 'textarea' ? (
                <>
                  <Textarea
                    ref={inputRef as any}
                    placeholder={currentField.placeholder}
                    value={localValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="min-h-[120px] text-base border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    rows={5}
                  />
                  {currentField.answerTemplates && currentField.answerTemplates.length > 0 && (
                    <AnswerTemplatesSelector
                      templates={currentField.answerTemplates}
                      currentValue={localValue}
                      mode={currentField.answerTemplateMode || 'replace'}
                      onSelectTemplate={(value) => handleValueChange(value)}
                    />
                  )}
                </>
              ) : currentField.type === 'select' ? (
                <Select 
                  value={localValue} 
                  onValueChange={(value) => handleValueChange(value)}
                >
                  <SelectTrigger className="text-base border-gray-200 focus:border-blue-300 h-12">
                    <SelectValue placeholder={currentField.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentField.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  ref={inputRef}
                  type={currentField.type}
                  placeholder={currentField.placeholder}
                  value={localValue}
                  onChange={(e) => handleValueChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="text-base border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 h-12"
                />
              )}
            </div>
            
            {currentField.required && currentValue.trim() === '' && (
              <p className="text-sm text-red-600">Este campo é obrigatório</p>
            )}
            
            <QuestionnaireHelp field={currentField} />
            
            <div className="flex justify-between items-center pt-4">
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
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                {isEditingFromSummary 
                  ? 'Salvar e Voltar ao Sumário' 
                  : (isLastQuestion ? 'Finalizar' : 'Próxima')
                }
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <FieldConfigModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleFieldUpdate}
        selectedText=""
        field={currentField}
        availableFields={selectedTemplate?.fields || []}
      />
    </>
  );
};

export default QuestionnaireQuestion;
