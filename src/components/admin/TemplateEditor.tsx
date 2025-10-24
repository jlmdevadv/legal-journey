
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ContractTemplate, ContractField } from '../../types/template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Plus, Info, Keyboard, Clock, Eye, Edit3, Download } from 'lucide-react';
import { toast } from 'sonner';
import FieldConfigModal from './FieldConfigModal';
import TemplateVersionHistory from './TemplateVersionHistory';
import SelectionConfirmationModal from './SelectionConfirmationModal';
import { useKeyboardSelection } from '../../hooks/useKeyboardSelection';
import { detectPlaceholders, humanizeVariableName, sanitizeVariableName } from '../../utils/templateUtils';
import { incrementVersion, createNewVersion, restoreVersion } from '../../utils/versionUtils';
import { downloadTemplateJSON } from '../../utils/templateExporter';

interface TemplateEditorProps {
  template: ContractTemplate;
  onSave: (template: ContractTemplate) => void;
  onCancel: () => void;
}

const TemplateEditor = ({ template, onSave, onCancel }: TemplateEditorProps) => {
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate>(template);
  const [editMode, setEditMode] = useState<'edit' | 'preview'>('edit');
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showSelectionConfirmation, setShowSelectionConfirmation] = useState(false);
  const [mouseSelectionInProgress, setMouseSelectionInProgress] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [changesDescription, setChangesDescription] = useState('');
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-detect {{variable}} placeholders and create fields
  const autoCreateFieldsFromPlaceholders = useCallback((templateText: string) => {
    const detectedPlaceholders = detectPlaceholders(templateText);
    const currentFieldIds = editingTemplate.fields.map(f => f.id);
    
    const newFields: ContractField[] = [];
    
    detectedPlaceholders.forEach(placeholder => {
      const fieldId = sanitizeVariableName(placeholder);
      
      // Only create field if it doesn't already exist
      if (!currentFieldIds.includes(fieldId)) {
        const newField: ContractField = {
          id: fieldId,
          label: humanizeVariableName(placeholder),
          type: 'text',
          placeholder: `Digite ${humanizeVariableName(placeholder).toLowerCase()}`,
          required: false
        };
        newFields.push(newField);
      }
    });

    if (newFields.length > 0) {
      console.log('Auto-creating fields for placeholders:', newFields);
      setEditingTemplate(prev => ({
        ...prev,
        fields: [...prev.fields, ...newFields]
      }));
    }
  }, [editingTemplate.fields]);

  // Monitor template changes for {{variable}} detection
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autoCreateFieldsFromPlaceholders(editingTemplate.template);
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [editingTemplate.template, autoCreateFieldsFromPlaceholders]);

  // Handle text selection (both mouse and keyboard)
  const handleTextSelection = useCallback((selectedText: string, range: { start: number; end: number }) => {
    console.log('Text selection detected:', selectedText);
    
    if (!selectedText.trim()) return;
    
    // Check if the selected text is already a placeholder
    const isExistingPlaceholder = editingTemplate.fields.some(field => 
      selectedText.includes(`[${field.id}]`) || selectedText === `[${field.id}]`
    );
    
    const isCurlyPlaceholder = /^\{\{.+\}\}$/.test(selectedText.trim());
    
    if (isExistingPlaceholder || isCurlyPlaceholder) {
      console.log('Selected text is already a placeholder, ignoring');
      return;
    }
    
    setSelectedText(selectedText);
    setSelectionRange(range);
    setEditingFieldIndex(null); // New field
    setShowSelectionConfirmation(true); // Show confirmation modal first
  }, [editingTemplate.fields]);

  const handleSelectionConfirm = () => {
    setShowSelectionConfirmation(false);
    setShowFieldModal(true);
  };

  const handleSelectionCancel = () => {
    setShowSelectionConfirmation(false);
    // Keep the selection active, do NOT clear it
    // User can now delete or edit the selected text
  };

  // Keyboard selection hook (only enabled in edit mode)
  const { shiftPressed, selectionInProgress: keyboardSelectionInProgress } = useKeyboardSelection({
    onTextSelected: handleTextSelection,
    enabled: editMode === 'edit'
  });

  const handleMouseDown = () => {
    console.log('Mouse down - starting selection');
    setMouseSelectionInProgress(true);
  };

  const handleMouseTextSelection = () => {
    console.log('Mouse text selection event triggered');
    
    const selection = window.getSelection();
    console.log('Selection object:', selection);
    
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      
      handleTextSelection(selectedText, {
        start: range.startOffset,
        end: range.endOffset
      });
      
      // Clear selection visually
      selection.removeAllRanges();
    } else {
      console.log('No valid text selected');
    }
    
    setMouseSelectionInProgress(false);
  };

  const handleFieldEdit = (fieldIndex: number) => {
    console.log('Editing field at index:', fieldIndex);
    const field = editingTemplate.fields[fieldIndex];
    setSelectedText('');
    setSelectionRange(null);
    setEditingFieldIndex(fieldIndex);
    setShowFieldModal(true);
  };

  const handleFieldSave = (field: ContractField) => {
    console.log('Saving field:', field);
    
    if (editingFieldIndex !== null) {
      // Editing existing field
      const updatedFields = [...editingTemplate.fields];
      updatedFields[editingFieldIndex] = field;
      
      setEditingTemplate({
        ...editingTemplate,
        fields: updatedFields
      });
    } else if (selectionRange && selectedText) {
      // Adding new field
      const placeholder = `[${field.id}]`;
      
      // Replace selected text with placeholder in template
      const updatedTemplate = editingTemplate.template.replace(selectedText, placeholder);
      
      // Add field to template fields
      const updatedFields = [...editingTemplate.fields, field];
      
      setEditingTemplate({
        ...editingTemplate,
        template: updatedTemplate,
        fields: updatedFields
      });
    }

    setShowFieldModal(false);
    setSelectedText('');
    setSelectionRange(null);
    setEditingFieldIndex(null);
  };

  const handleRemoveField = (fieldIndex: number) => {
    const field = editingTemplate.fields[fieldIndex];
    if (confirm(`Tem certeza que deseja remover o campo "${field.label}"?`)) {
      // Remove field from array
      const updatedFields = editingTemplate.fields.filter((_, index) => index !== fieldIndex);
      
      // Remove placeholder from template
      const placeholder = `[${field.id}]`;
      const updatedTemplate = editingTemplate.template.replace(
        new RegExp(`\\[${field.id}\\]`, 'g'), 
        field.label || 'CAMPO_REMOVIDO'
      );
      
      setEditingTemplate({
        ...editingTemplate,
        template: updatedTemplate,
        fields: updatedFields
      });
    }
  };

  const handleSaveWithVersion = () => {
    if (!changesDescription.trim()) {
      toast.error('Por favor, descreva as mudanças realizadas');
      return;
    }

    // Convert {{variable}} syntax to [field-id] before saving
    let finalTemplate = editingTemplate.template;
    const placeholders = detectPlaceholders(finalTemplate);
    
    placeholders.forEach(placeholder => {
      const fieldId = sanitizeVariableName(placeholder);
      const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
      finalTemplate = finalTemplate.replace(regex, `[${fieldId}]`);
    });

    // Criar nova versão
    const newVersionData = createNewVersion(editingTemplate, changesDescription);

    const finalEditingTemplate = {
      ...editingTemplate,
      template: finalTemplate,
      version: newVersionData
    };

    onSave(finalEditingTemplate);
    setChangesDescription('');
    setShowSaveVersionDialog(false);
  };

  const handleRestore = (version: string) => {
    const restored = restoreVersion(editingTemplate, version);
    if (restored) {
      setEditingTemplate(restored);
      setShowVersionHistory(false);
      toast.success(`Versão ${version} restaurada. Faça as alterações necessárias e salve.`);
    } else {
      toast.error('Não foi possível restaurar esta versão');
    }
  };

  const handlePreview = (version: string) => {
    toast.info('Funcionalidade de preview em desenvolvimento');
  };

  const renderPreview = () => {
    let content = editingTemplate.template;
    
    // Highlight {{variable}} placeholders first
    content = content.replace(
      /\{\{([^}]+)\}\}/g,
      '<span class="bg-green-100 border border-green-300 px-1 rounded transition-colors" title="Placeholder detectado: $1">{{$1}}</span>'
    );
    
    // Then highlight existing [field-id] placeholders
    editingTemplate.fields.forEach(field => {
      const placeholder = `[${field.id}]`;
      content = content.replace(
        new RegExp(`\\[${field.id}\\]`, 'g'),
        `<span class="bg-blue-100 border border-blue-300 px-1 rounded hover:bg-blue-200 cursor-pointer transition-colors" data-field-id="${field.id}" title="Clique para editar: ${field.label}">[${field.id}]</span>`
      );
    });

    return { __html: content };
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const fieldId = target.getAttribute('data-field-id');
    
    if (fieldId) {
      const fieldIndex = editingTemplate.fields.findIndex(f => f.id === fieldId);
      if (fieldIndex !== -1) {
        handleFieldEdit(fieldIndex);
      }
    }
  };

  const isSelectionActive = mouseSelectionInProgress || keyboardSelectionInProgress || shiftPressed;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-contractPrimary">
            Editando: {editingTemplate.name}
          </h1>
          {editingTemplate.version && (
            <span className="text-sm text-gray-500">
              (v{editingTemplate.version.version})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {/* Toggle Edit/Preview Mode */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <Button
              variant={editMode === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setEditMode('edit')}
              className="flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              Editar
            </Button>
            <Button
              variant={editMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setEditMode('preview')}
              className="flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Preview
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowVersionHistory(true)}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Histórico
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              downloadTemplateJSON(editingTemplate);
              toast.success('JSON exportado com sucesso!');
            }}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar JSON
          </Button>
          <Button
            onClick={() => setShowSaveVersionDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Nova Versão
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fields List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Campos Configurados ({editingTemplate.fields.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {editingTemplate.fields.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    <p className="mb-2">Crie campos editáveis de duas formas:</p>
                    <div className="text-sm space-y-1">
                      <p>• Selecione texto no preview (mouse ou Shift+setas)</p>
                      <p>• Digite <code className="bg-gray-100 px-1 rounded">{'{{nome_variavel}}'}</code> no template</p>
                    </div>
                  </div>
                ) : (
                  editingTemplate.fields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-gray-500">
                            Placeholder: [{field.id}]
                          </div>
                          <div className="text-sm text-gray-500">
                            Tipo: {field.type}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFieldEdit(index)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveField(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Editor/Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editMode === 'edit' ? (
                  <>
                    <Edit3 className="w-5 h-5" />
                    Modo Edição
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    Modo Preview
                  </>
                )}
              </CardTitle>
              <div className="space-y-2 text-sm text-gray-600">
                {editMode === 'edit' ? (
                  <>
                    <p className="text-blue-600 font-medium">Edite o texto livremente. O cursor funciona normalmente.</p>
                    <div className="space-y-1">
                      <p className="flex items-center gap-2">
                        <Keyboard className="w-3 h-3" />
                        <strong>Como criar campos editáveis:</strong>
                      </p>
                      <p className="ml-5">• Selecione texto (mouse ou Shift+setas)</p>
                      <p className="ml-5">• Digite <code className="bg-gray-100 px-1 rounded text-xs">{'{{variavel}}'}</code> no texto</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-100 border border-blue-300 rounded"></span>
                      Campos configurados (clique para editar)
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-100 border border-green-300 rounded"></span>
                      Placeholders detectados automaticamente
                    </p>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editMode === 'edit' ? (
                <>
                  <Textarea
                    ref={textareaRef}
                    value={editingTemplate.template}
                    onChange={(e) => {
                      setEditingTemplate(prev => ({
                        ...prev,
                        template: e.target.value
                      }));
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseTextSelection}
                    className={`
                      w-full min-h-[400px] font-mono text-sm
                      ${isSelectionActive ? 'bg-blue-50' : ''}
                      transition-colors
                    `}
                    placeholder="Digite o texto do template aqui..."
                  />
                  {isSelectionActive && (
                    <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {shiftPressed ? 'Use as setas para selecionar texto (mantenha Shift pressionado)' : 'Selecione o texto que deseja transformar em campo editável'}
                    </div>
                  )}
                </>
              ) : (
                <div
                  ref={previewRef}
                  className="whitespace-pre-wrap text-sm border p-4 rounded-lg bg-white"
                  onClick={handlePreviewClick}
                  dangerouslySetInnerHTML={renderPreview()}
                  style={{ 
                    minHeight: '400px'
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <SelectionConfirmationModal
        open={showSelectionConfirmation}
        selectedText={selectedText}
        onConfirm={handleSelectionConfirm}
        onCancel={handleSelectionCancel}
      />

      <FieldConfigModal
        open={showFieldModal}
        onOpenChange={setShowFieldModal}
        onSave={handleFieldSave}
        selectedText={selectedText}
        field={editingFieldIndex !== null ? editingTemplate.fields[editingFieldIndex] : undefined}
      />

      {/* Dialog para descrição de mudanças */}
      <Dialog open={showSaveVersionDialog} onOpenChange={setShowSaveVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Nova Versão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Descreva as mudanças realizadas:
              </label>
              <textarea
                className="w-full mt-2 p-2 border rounded-lg"
                rows={4}
                placeholder="Ex: Removido título redundante, atualizada cláusula 5ª conforme Lei X..."
                value={changesDescription}
                onChange={(e) => setChangesDescription(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>Nova versão: <strong>{incrementVersion(editingTemplate.version?.version || "1.0")}</strong></p>
              <p className="mt-1">Histórico manterá apenas as 2 últimas versões anteriores.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSaveVersionDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveWithVersion}
                className="bg-green-600 hover:bg-green-700"
              >
                Salvar Versão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de histórico */}
      <TemplateVersionHistory
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        template={editingTemplate}
        onRestore={handleRestore}
        onPreview={handlePreview}
      />
    </div>
  );
};

export default TemplateEditor;
