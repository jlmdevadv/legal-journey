
import React, { useState, useEffect } from 'react';
import { ContractField, FieldCondition, ConditionalLogic } from '@/types/template';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import HelpSectionEditor from './HelpSectionEditor';
import { useContract } from '@/contexts/ContractContext';

interface FieldConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: ContractField) => void;
  selectedText: string;
  field?: ContractField; // For editing existing fields
}

const FieldConfigModal = ({ open, onOpenChange, onSave, selectedText, field }: FieldConfigModalProps) => {
  const { selectedTemplate } = useContract();
  
  const [fieldData, setFieldData] = useState<Partial<ContractField>>({
    id: '',
    label: '',
    type: 'text',
    placeholder: '',
    required: false,
    repeatPerParty: false,
    howToFill: '',
    whyImportant: '',
    videoLink: '',
    aiAssistantLink: '',
    options: [],
    conditionalLogic: undefined,
    answerTemplates: []
  });

  const [conditions, setConditions] = useState<FieldCondition[]>([]);
  const [showConditionsEditor, setShowConditionsEditor] = useState(false);
  const [showAnswerTemplatesEditor, setShowAnswerTemplatesEditor] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateValue, setNewTemplateValue] = useState('');

  useEffect(() => {
    if (field) {
      setFieldData({
        id: field.id || '',
        label: field.label || '',
        type: field.type || 'text',
        placeholder: field.placeholder || '',
        required: field.required || false,
        repeatPerParty: field.repeatPerParty || false,
        howToFill: field.howToFill || '',
        whyImportant: field.whyImportant || '',
        videoLink: field.videoLink || '',
        aiAssistantLink: field.aiAssistantLink || '',
        options: field.options || [],
        conditionalLogic: field.conditionalLogic,
        answerTemplates: field.answerTemplates || []
      });
      setConditions(field.conditionalLogic?.conditions || []);
      setShowConditionsEditor(!!field.conditionalLogic && field.conditionalLogic.conditions.length > 0);
      setShowAnswerTemplatesEditor(!!field.answerTemplates && field.answerTemplates.length > 0);
    } else {
      setFieldData({
        id: '',
        label: '',
        type: 'text',
        placeholder: '',
        required: false,
        repeatPerParty: false,
        howToFill: '',
        whyImportant: '',
        videoLink: '',
        aiAssistantLink: '',
        options: [],
        conditionalLogic: undefined,
        answerTemplates: []
      });
      setConditions([]);
      setShowConditionsEditor(false);
      setShowAnswerTemplatesEditor(false);
    }
  }, [field]);

  const [newOption, setNewOption] = useState('');

  const generateFieldId = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleLabelChange = (label: string) => {
    setFieldData(prev => ({
      ...prev,
      label,
      id: prev.id || generateFieldId(label)
    }));
  };

  const handleAddOption = () => {
    if (newOption.trim() && fieldData.options) {
      setFieldData(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFieldData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddAnswerTemplate = () => {
    if (newTemplateTitle.trim() && newTemplateValue.trim()) {
      setFieldData(prev => ({
        ...prev,
        answerTemplates: [...(prev.answerTemplates || []), { title: newTemplateTitle.trim(), value: newTemplateValue.trim() }]
      }));
      setNewTemplateTitle('');
      setNewTemplateValue('');
    }
  };

  const handleRemoveAnswerTemplate = (index: number) => {
    setFieldData(prev => ({
      ...prev,
      answerTemplates: prev.answerTemplates?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddCondition = () => {
    const newCondition: FieldCondition = {
      fieldId: '',
      operator: 'equals',
      value: '',
      logicOperator: 'AND'
    };
    setConditions([...conditions, newCondition]);
  };

  const handleUpdateCondition = (index: number, updates: Partial<FieldCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
    
    // Update fieldData
    if (newConditions.length > 0 && newConditions.every(c => c.fieldId && c.value !== '')) {
      setFieldData(prev => ({
        ...prev,
        conditionalLogic: {
          conditions: newConditions,
          action: 'show'
        }
      }));
    }
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    
    if (newConditions.length === 0) {
      setFieldData(prev => ({
        ...prev,
        conditionalLogic: undefined
      }));
    } else {
      setFieldData(prev => ({
        ...prev,
        conditionalLogic: {
          conditions: newConditions,
          action: 'show'
        }
      }));
    }
  };

  const handleSave = () => {
    if (!fieldData.label || !fieldData.id) return;

    const completeField: ContractField = {
      id: fieldData.id,
      label: fieldData.label,
      type: fieldData.type as any,
      placeholder: fieldData.placeholder || `Digite ${fieldData.label.toLowerCase()}`,
      required: fieldData.required || false,
      repeatPerParty: fieldData.repeatPerParty || false,
      ...(fieldData.howToFill && { howToFill: fieldData.howToFill }),
      ...(fieldData.whyImportant && { whyImportant: fieldData.whyImportant }),
      ...(fieldData.videoLink && { videoLink: fieldData.videoLink }),
      ...(fieldData.aiAssistantLink && { aiAssistantLink: fieldData.aiAssistantLink }),
      ...(fieldData.type === 'select' && fieldData.options && { options: fieldData.options }),
      ...(fieldData.conditionalLogic && fieldData.conditionalLogic.conditions.length > 0 && { conditionalLogic: fieldData.conditionalLogic }),
      ...(fieldData.answerTemplates && fieldData.answerTemplates.length > 0 && { answerTemplates: fieldData.answerTemplates })
    };

    onSave(completeField);
    onOpenChange(false);
  };

  const getOperatorLabel = (operator: string) => {
    const labels: Record<string, string> = {
      equals: 'Igual a',
      notEquals: 'Diferente de',
      contains: 'Contém',
      greaterThan: 'Maior que',
      lessThan: 'Menor que'
    };
    return labels[operator] || operator;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {field ? 'Editar Campo' : 'Configurar Novo Campo'}
          </DialogTitle>
          <DialogDescription>
            {selectedText && `Texto selecionado: "${selectedText}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Field Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="field-label">Título da Pergunta *</Label>
                <Input
                  id="field-label"
                  value={fieldData.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Ex: Nome completo do contratante"
                />
              </div>

              <div>
                <Label htmlFor="field-id">ID do Campo</Label>
                <Input
                  id="field-id"
                  value={fieldData.id}
                  onChange={(e) => setFieldData(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="Ex: contractor-name"
                />
              </div>

              <div>
                <Label htmlFor="field-type">Tipo de Campo</Label>
                <Select
                  value={fieldData.type}
                  onValueChange={(value) => setFieldData(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="textarea">Texto Longo</SelectItem>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="select">Seleção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={fieldData.placeholder}
                  onChange={(e) => setFieldData(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="Ex: Digite o nome completo"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="field-required"
                  checked={fieldData.required}
                  onCheckedChange={(checked) => setFieldData(prev => ({ ...prev, required: !!checked }))}
                />
                <Label htmlFor="field-required">Campo obrigatório</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="repeat-per-party"
                  checked={fieldData.repeatPerParty || false}
                  onCheckedChange={(checked) => setFieldData(prev => ({ ...prev, repeatPerParty: !!checked }))}
                />
                <Label htmlFor="repeat-per-party" className="cursor-pointer">
                  <span className="font-medium">Repetir esta pergunta para cada Parte Principal</span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    O campo será exibido uma vez para cada parte do contrato
                  </span>
                </Label>
              </div>

              {/* Options for select type */}
              {fieldData.type === 'select' && (
                <div>
                  <Label>Opções de Seleção</Label>
                  <div className="space-y-2">
                    {fieldData.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={option} readOnly />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Nova opção"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                      />
                      <Button type="button" variant="outline" onClick={handleAddOption}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conditional Logic */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Lógica de Visibilidade (Opcional)
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConditionsEditor(!showConditionsEditor)}
                >
                  {showConditionsEditor ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Configurar
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            {showConditionsEditor && (
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure quando este campo deve ser exibido com base em respostas anteriores.
                </p>

                {conditions.map((condition, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/50">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold">Condição {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCondition(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Quando o campo</Label>
                      <Select
                        value={condition.fieldId}
                        onValueChange={(value) => handleUpdateCondition(index, { fieldId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedTemplate?.fields
                            .filter(f => f.id !== fieldData.id) // Não pode depender de si mesmo
                            .map(f => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>For</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => handleUpdateCondition(index, { operator: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Igual a</SelectItem>
                          <SelectItem value="notEquals">Diferente de</SelectItem>
                          <SelectItem value="contains">Contém</SelectItem>
                          <SelectItem value="greaterThan">Maior que</SelectItem>
                          <SelectItem value="lessThan">Menor que</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Valor</Label>
                      {selectedTemplate?.fields.find(f => f.id === condition.fieldId)?.type === 'select' ? (
                        <Select
                          value={String(condition.value)}
                          onValueChange={(value) => handleUpdateCondition(index, { value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma opção" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTemplate?.fields.find(f => f.id === condition.fieldId)?.options?.map(opt => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={condition.value}
                          onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
                          placeholder="Digite o valor de comparação"
                        />
                      )}
                    </div>

                    {index < conditions.length - 1 && (
                      <div>
                        <Label>Operador Lógico</Label>
                        <Select
                          value={condition.logicOperator || 'AND'}
                          onValueChange={(value) => handleUpdateCondition(index, { logicOperator: value as 'AND' | 'OR' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">E (AND)</SelectItem>
                            <SelectItem value="OR">OU (OR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCondition}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Condição
                </Button>

                {conditions.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      📋 Resumo da Lógica:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Este campo será exibido quando:{' '}
                      {conditions.map((c, i) => (
                        <React.Fragment key={i}>
                          <strong>{selectedTemplate?.fields.find(f => f.id === c.fieldId)?.label || c.fieldId}</strong>
                          {' '}<em>{getOperatorLabel(c.operator)}</em>{' '}
                          <strong>"{c.value}"</strong>
                          {i < conditions.length - 1 && ` ${c.logicOperator} `}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Answer Templates */}
          {fieldData.type === 'textarea' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Modelos de Resposta (Opcional)
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnswerTemplatesEditor(!showAnswerTemplatesEditor)}
                  >
                    {showAnswerTemplatesEditor ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Configurar
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showAnswerTemplatesEditor && (
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure sugestões de resposta pré-formatadas que o usuário pode selecionar com um clique.
                  </p>

                  {fieldData.answerTemplates && fieldData.answerTemplates.length > 0 && (
                    <div className="space-y-3">
                      {fieldData.answerTemplates.map((template, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-muted/50 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{template.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.value}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAnswerTemplate(index)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 pt-3 border-t">
                    <div>
                      <Label htmlFor="template-title">Título da Sugestão</Label>
                      <Input
                        id="template-title"
                        value={newTemplateTitle}
                        onChange={(e) => setNewTemplateTitle(e.target.value)}
                        placeholder="Ex: Opção A: Reinvestimento Total"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-value">Texto Completo</Label>
                      <Textarea
                        id="template-value"
                        value={newTemplateValue}
                        onChange={(e) => setNewTemplateValue(e.target.value)}
                        placeholder="Digite o texto completo que será inserido quando o usuário clicar nesta opção..."
                        className="min-h-24"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddAnswerTemplate}
                      disabled={!newTemplateTitle.trim() || !newTemplateValue.trim()}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Modelo de Resposta
                    </Button>
                  </div>

                  {fieldData.answerTemplates && fieldData.answerTemplates.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        💡 Preview
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        O usuário verá {fieldData.answerTemplates.length} {fieldData.answerTemplates.length === 1 ? 'botão' : 'botões'} abaixo do campo de texto com {fieldData.answerTemplates.length === 1 ? 'esta opção' : 'estas opções'}. Ao clicar, o texto será automaticamente inserido no campo.
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Optional Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instruções Opcionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <HelpSectionEditor
                label="Quer incluir instruções de como preencher essa cláusula?"
                value={fieldData.howToFill || ''}
                onChange={(value) => setFieldData(prev => ({ ...prev, howToFill: value }))}
                placeholder="Como o usuário deve preencher este campo..."
                multiline
              />

              <HelpSectionEditor
                label="Quer incluir instruções de porque a parte deve preencher esse campo?"
                value={fieldData.whyImportant || ''}
                onChange={(value) => setFieldData(prev => ({ ...prev, whyImportant: value }))}
                placeholder="Por que este campo é importante..."
                multiline
              />

              <HelpSectionEditor
                label="Quer incluir o link de um vídeo explicativo?"
                value={fieldData.videoLink || ''}
                onChange={(value) => setFieldData(prev => ({ ...prev, videoLink: value }))}
                placeholder="https://youtube.com/watch?v=..."
              />

              <HelpSectionEditor
                label="Quer incluir um link para auxílio de IA?"
                value={fieldData.aiAssistantLink || ''}
                onChange={(value) => setFieldData(prev => ({ ...prev, aiAssistantLink: value }))}
                placeholder="https://chatgpt.com/g/..."
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!fieldData.label || !fieldData.id}>
              Salvar Campo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FieldConfigModal;
