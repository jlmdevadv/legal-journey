
import React, { useState } from 'react';
import { ContractField } from '../../data/contractTemplates';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus } from 'lucide-react';

interface FieldConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: ContractField) => void;
  selectedText: string;
  field?: ContractField; // For editing existing fields
}

const FieldConfigModal = ({ open, onOpenChange, onSave, selectedText, field }: FieldConfigModalProps) => {
  const [fieldData, setFieldData] = useState<Partial<ContractField>>(() => ({
    id: field?.id || '',
    label: field?.label || '',
    type: field?.type || 'text',
    placeholder: field?.placeholder || '',
    required: field?.required || false,
    howToFill: field?.howToFill || '',
    whyImportant: field?.whyImportant || '',
    videoLink: field?.videoLink || '',
    aiAssistantLink: field?.aiAssistantLink || '',
    options: field?.options || []
  }));

  const [showHowToFill, setShowHowToFill] = useState(!!field?.howToFill);
  const [showWhyImportant, setShowWhyImportant] = useState(!!field?.whyImportant);
  const [showVideoLink, setShowVideoLink] = useState(!!field?.videoLink);
  const [showAiAssistant, setShowAiAssistant] = useState(!!field?.aiAssistantLink);
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

  const handleSave = () => {
    if (!fieldData.label || !fieldData.id) return;

    const completeField: ContractField = {
      id: fieldData.id,
      label: fieldData.label,
      type: fieldData.type as any,
      placeholder: fieldData.placeholder || `Digite ${fieldData.label.toLowerCase()}`,
      required: fieldData.required || false,
      ...(showHowToFill && fieldData.howToFill && { howToFill: fieldData.howToFill }),
      ...(showWhyImportant && fieldData.whyImportant && { whyImportant: fieldData.whyImportant }),
      ...(showVideoLink && fieldData.videoLink && { videoLink: fieldData.videoLink }),
      ...(showAiAssistant && fieldData.aiAssistantLink && { aiAssistantLink: fieldData.aiAssistantLink }),
      ...(fieldData.type === 'select' && fieldData.options && { options: fieldData.options })
    };

    onSave(completeField);
    onOpenChange(false);
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

          {/* Optional Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instruções Opcionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* How to Fill */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Quer incluir instruções de como preencher essa cláusula?</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={showHowToFill ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowHowToFill(true)}
                    >
                      Sim
                    </Button>
                    <Button
                      type="button"
                      variant={!showHowToFill ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setShowHowToFill(false);
                        setFieldData(prev => ({ ...prev, howToFill: '' }));
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
                {showHowToFill && (
                  <Textarea
                    value={fieldData.howToFill}
                    onChange={(e) => setFieldData(prev => ({ ...prev, howToFill: e.target.value }))}
                    placeholder="Como o usuário deve preencher este campo..."
                    rows={3}
                  />
                )}
              </div>

              {/* Why Important */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Quer incluir instruções de porque a parte deve preencher esse campo?</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={showWhyImportant ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowWhyImportant(true)}
                    >
                      Sim
                    </Button>
                    <Button
                      type="button"
                      variant={!showWhyImportant ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setShowWhyImportant(false);
                        setFieldData(prev => ({ ...prev, whyImportant: '' }));
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
                {showWhyImportant && (
                  <Textarea
                    value={fieldData.whyImportant}
                    onChange={(e) => setFieldData(prev => ({ ...prev, whyImportant: e.target.value }))}
                    placeholder="Por que este campo é importante..."
                    rows={3}
                  />
                )}
              </div>

              {/* Video Link */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Quer incluir o link de um vídeo explicativo?</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={showVideoLink ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowVideoLink(true)}
                    >
                      Sim
                    </Button>
                    <Button
                      type="button"
                      variant={!showVideoLink ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setShowVideoLink(false);
                        setFieldData(prev => ({ ...prev, videoLink: '' }));
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
                {showVideoLink && (
                  <Input
                    value={fieldData.videoLink}
                    onChange={(e) => setFieldData(prev => ({ ...prev, videoLink: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                )}
              </div>

              {/* AI Assistant Link */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Quer incluir um link para auxílio de IA?</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={showAiAssistant ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowAiAssistant(true)}
                    >
                      Sim
                    </Button>
                    <Button
                      type="button"
                      variant={!showAiAssistant ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setShowAiAssistant(false);
                        setFieldData(prev => ({ ...prev, aiAssistantLink: '' }));
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
                {showAiAssistant && (
                  <Input
                    value={fieldData.aiAssistantLink}
                    onChange={(e) => setFieldData(prev => ({ ...prev, aiAssistantLink: e.target.value }))}
                    placeholder="https://chatgpt.com/g/..."
                  />
                )}
              </div>
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
