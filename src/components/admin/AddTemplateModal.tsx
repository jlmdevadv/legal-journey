import React, { useState } from 'react';
import { ContractTemplate } from '../../data/contractTemplates';
import { useContract } from '../../contexts/ContractContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText } from 'lucide-react';

interface AddTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddTemplateModal = ({ open, onOpenChange }: AddTemplateModalProps) => {
  const { startEditingTemplate } = useContract();
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTemplateContent(content);
    };
    reader.readAsText(file);
  };

  const handleNext = () => {
    if (!templateName.trim() || !templateContent.trim()) return;

    const newTemplate: ContractTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName,
      description: templateDescription || 'Template personalizado',
      fields: [], // Will be configured in the editor
      template: templateContent
    };

    // Start editing the template
    startEditingTemplate(newTemplate);
    onOpenChange(false);
    
    // Reset form
    setTemplateName('');
    setTemplateDescription('');
    setTemplateContent('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Adicionar Novo Modelo
          </DialogTitle>
          <DialogDescription>
            Crie um novo modelo de contrato personalizado
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Nome do Modelo *</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
            </div>
            
            <div>
              <Label htmlFor="template-description">Descrição</Label>
              <Input
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Breve descrição do modelo"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Conteúdo do Modelo</Label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Clique para fazer upload de um arquivo
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Formatos suportados: .txt, .doc, .md
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".txt,.doc,.md"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>

            <div className="text-center text-gray-500 font-medium">OU</div>

            <div>
              <Label htmlFor="template-content">Cole o texto do modelo</Label>
              <Textarea
                id="template-content"
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder="Cole aqui o texto completo do modelo de contrato..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!templateName.trim() || !templateContent.trim() || isLoading}
            >
              {isLoading ? 'Processando...' : 'Prosseguir para Configuração'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTemplateModal;
