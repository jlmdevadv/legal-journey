import React, { useEffect, useRef, useState } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import QuestionnaireHelp from './QuestionnaireHelp';
import FieldConfigModal from '../admin/FieldConfigModal';

const QuestionnaireQuestion = () => {
  const { 
    selectedTemplate, 
    formValues, 
    currentQuestionIndex, 
    isAdminMode,
    updateFormValue, 
    nextQuestion, 
    previousQuestion,
    updateCustomTemplate
  } = useContract();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!selectedTemplate || currentQuestionIndex < 0 || currentQuestionIndex >= selectedTemplate.fields.length) {
    return null;
  }

  const currentField = selectedTemplate.fields[currentQuestionIndex];
  const currentValue = formValues[currentField.id] || '';
  const progress = ((currentQuestionIndex + 1) / selectedTemplate.fields.length) * 100;
  const isLastQuestion = currentQuestionIndex === selectedTemplate.fields.length - 1;
  const canProceed = !currentField.required || currentValue.trim() !== '';

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestionIndex]);

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
    if (!selectedTemplate.id.startsWith('custom-')) return;

    const updatedFields = selectedTemplate.fields.map((field, index) => 
      index === currentQuestionIndex ? updatedField : field
    );

    const updatedTemplate = {
      ...selectedTemplate,
      fields: updatedFields
    };

    updateCustomTemplate(selectedTemplate.id, updatedTemplate);
    setShowEditModal(false);
  };

  return (
    <>
      <div className="min-h-[600px] flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Pergunta {currentQuestionIndex + 1} de {selectedTemplate.fields.length}
              </span>
              <div className="flex items-center gap-2">
                {isAdminMode && selectedTemplate.id.startsWith('custom-') && (
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
                <Textarea
                  ref={inputRef as any}
                  placeholder={currentField.placeholder}
                  value={currentValue}
                  onChange={(e) => updateFormValue(currentField.id, e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[120px] text-base border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  rows={5}
                />
              ) : currentField.type === 'select' ? (
                <Select 
                  value={currentValue} 
                  onValueChange={(value) => updateFormValue(currentField.id, value)}
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
                  value={currentValue}
                  onChange={(e) => updateFormValue(currentField.id, e.target.value)}
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
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                {isLastQuestion ? 'Finalizar' : 'Próxima'}
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
      />
    </>
  );
};

export default QuestionnaireQuestion;
