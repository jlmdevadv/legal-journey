
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ContractTemplate, ContractField } from '../../types/template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Info, Keyboard } from 'lucide-react';
import FieldConfigModal from './FieldConfigModal';
import { useKeyboardSelection } from '../../hooks/useKeyboardSelection';
import { detectPlaceholders, humanizeVariableName, sanitizeVariableName } from '../../utils/templateUtils';

interface TemplateEditorProps {
  template: ContractTemplate;
  onSave: (template: ContractTemplate) => void;
  onCancel: () => void;
}

const TemplateEditor = ({ template, onSave, onCancel }: TemplateEditorProps) => {
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate>(template);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [mouseSelectionInProgress, setMouseSelectionInProgress] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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
    setShowFieldModal(true);
  }, [editingTemplate.fields]);

  // Keyboard selection hook
  const { shiftPressed, selectionInProgress: keyboardSelectionInProgress } = useKeyboardSelection({
    onTextSelected: handleTextSelection,
    enabled: true
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

  const handleSave = () => {
    // Convert {{variable}} syntax to [field-id] before saving
    let finalTemplate = editingTemplate.template;
    const placeholders = detectPlaceholders(finalTemplate);
    
    placeholders.forEach(placeholder => {
      const fieldId = sanitizeVariableName(placeholder);
      const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
      finalTemplate = finalTemplate.replace(regex, `[${fieldId}]`);
    });

    const finalEditingTemplate = {
      ...editingTemplate,
      template: finalTemplate
    };

    onSave(finalEditingTemplate);
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
        </div>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar Template
        </Button>
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

        {/* Template Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Preview do Template
                <Info className="w-4 h-4 text-blue-500" />
              </CardTitle>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-100 border border-blue-300 rounded"></span>
                  Campos configurados (clique para editar)
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-100 border border-green-300 rounded"></span>
                  Placeholders detectados automaticamente
                </p>
                <div className="space-y-1">
                  <p className="flex items-center gap-2">
                    <Keyboard className="w-3 h-3" />
                    <strong>Métodos de criação:</strong>
                  </p>
                  <p className="ml-5">• Selecionar texto (mouse ou Shift+setas)</p>
                  <p className="ml-5">• Digite <code className="bg-gray-100 px-1 rounded text-xs">{'{{variavel}}'}</code> no texto</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={previewRef}
                className={`
                  whitespace-pre-wrap text-sm border p-4 rounded-lg cursor-text select-text
                  ${isSelectionActive ? 'bg-blue-50' : 'bg-white'}
                  transition-colors
                `}
                contentEditable
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseTextSelection}
                onClick={handlePreviewClick}
                onInput={(e) => {
                  const target = e.target as HTMLDivElement;
                  setEditingTemplate(prev => ({
                    ...prev,
                    template: target.textContent || ''
                  }));
                }}
                dangerouslySetInnerHTML={renderPreview()}
                style={{ 
                  minHeight: '400px',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  MozUserSelect: 'text'
                }}
              />
              {isSelectionActive && (
                <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {shiftPressed ? 'Use as setas para selecionar texto (mantenha Shift pressionado)' : 'Selecione o texto que deseja transformar em campo editável'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <FieldConfigModal
        open={showFieldModal}
        onOpenChange={setShowFieldModal}
        onSave={handleFieldSave}
        selectedText={selectedText}
        field={editingFieldIndex !== null ? editingTemplate.fields[editingFieldIndex] : undefined}
      />
    </div>
  );
};

export default TemplateEditor;
