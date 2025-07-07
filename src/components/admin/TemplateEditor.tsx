
import React, { useState, useRef } from 'react';
import { ContractTemplate, ContractField } from '../../data/contractTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Info } from 'lucide-react';
import FieldConfigModal from './FieldConfigModal';

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
  const [selectionInProgress, setSelectionInProgress] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    console.log('Mouse down - starting selection');
    setSelectionInProgress(true);
  };

  const handleTextSelection = () => {
    console.log('Text selection event triggered');
    
    const selection = window.getSelection();
    console.log('Selection object:', selection);
    
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      console.log('Selected text:', selectedText);
      
      // Check if the selected text is already a placeholder
      const isPlaceholder = editingTemplate.fields.some(field => 
        selectedText.includes(`[${field.id}]`) || selectedText === `[${field.id}]`
      );
      
      if (isPlaceholder) {
        console.log('Selected text is already a placeholder, ignoring');
        return;
      }
      
      const range = selection.getRangeAt(0);
      console.log('Selection range:', {
        start: range.startOffset,
        end: range.endOffset,
        text: selectedText
      });
      
      setSelectedText(selectedText);
      setSelectionRange({
        start: range.startOffset,
        end: range.endOffset
      });
      setEditingFieldIndex(null); // New field
      setShowFieldModal(true);
      
      // Clear selection visually
      selection.removeAllRanges();
    } else {
      console.log('No valid text selected');
    }
    
    setSelectionInProgress(false);
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
    onSave(editingTemplate);
  };

  const renderPreview = () => {
    let content = editingTemplate.template;
    
    // Highlight existing placeholders
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
                  <p className="text-gray-500 text-center py-4">
                    Selecione texto no preview para criar campos editáveis
                  </p>
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
                  Campos existentes (clique para editar)
                </p>
                <p>• Selecione qualquer texto para transformar em campo editável</p>
                <p>• Use o mouse para selecionar o texto desejado</p>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={previewRef}
                className={`
                  whitespace-pre-wrap text-sm border p-4 rounded-lg cursor-text select-text
                  ${selectionInProgress ? 'bg-blue-50' : 'bg-white'}
                  transition-colors
                `}
                onMouseDown={handleMouseDown}
                onMouseUp={handleTextSelection}
                onClick={handlePreviewClick}
                dangerouslySetInnerHTML={renderPreview()}
                style={{ 
                  minHeight: '400px',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  MozUserSelect: 'text'
                }}
              />
              {selectionInProgress && (
                <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Selecione o texto que deseja transformar em campo editável
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
