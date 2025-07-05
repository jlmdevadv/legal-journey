
import React, { useState, useRef } from 'react';
import { ContractTemplate, ContractField } from '../../data/contractTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus } from 'lucide-react';
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
  const previewRef = useRef<HTMLDivElement>(null);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString();
      const range = selection.getRangeAt(0);
      
      setSelectedText(selectedText);
      setSelectionRange({
        start: range.startOffset,
        end: range.endOffset
      });
      setShowFieldModal(true);
    }
  };

  const handleFieldSave = (field: ContractField) => {
    if (!selectionRange || !selectedText) return;

    // Create placeholder for the field
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

    setShowFieldModal(false);
    setSelectedText('');
    setSelectionRange(null);
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
        `<span class="bg-blue-100 border border-blue-300 px-1 rounded">[${field.id}]</span>`
      );
    });

    return { __html: content };
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
                    <div key={field.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{field.label}</div>
                      <div className="text-sm text-gray-500">
                        Placeholder: [{field.id}]
                      </div>
                      <div className="text-sm text-gray-500">
                        Tipo: {field.type}
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
              <CardTitle>Preview do Template</CardTitle>
              <p className="text-sm text-gray-600">
                Selecione o texto que deseja transformar em campo editável
              </p>
            </CardHeader>
            <CardContent>
              <div
                ref={previewRef}
                className="whitespace-pre-wrap text-sm border p-4 rounded-lg cursor-text select-text"
                onMouseUp={handleTextSelection}
                dangerouslySetInnerHTML={renderPreview()}
                style={{ minHeight: '400px' }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <FieldConfigModal
        open={showFieldModal}
        onOpenChange={setShowFieldModal}
        onSave={handleFieldSave}
        selectedText={selectedText}
      />
    </div>
  );
};

export default TemplateEditor;
