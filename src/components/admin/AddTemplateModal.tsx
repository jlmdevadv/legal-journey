
import React, { useState } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, Type } from 'lucide-react';
import { ContractTemplate } from '../../data/contractTemplates';

interface AddTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddTemplateModal = ({ open, onOpenChange }: AddTemplateModalProps) => {
  const { addCustomTemplate } = useContract();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('');
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTemplate(content);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !template.trim()) return;

    setIsLoading(true);

    const newTemplate: ContractTemplate = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      template: template.trim(),
      fields: [], // Initially empty, will be populated in editor
    };

    addCustomTemplate(newTemplate);
    
    // Clear form
    setName('');
    setDescription('');
    setTemplate('');
    setInputMethod('text');
    
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setName('');
    setDescription('');
    setTemplate('');
    setInputMethod('text');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-contractPrimary">
            <FileText className="w-5 h-5" />
            Adicionar Novo Modelo
          </DialogTitle>
          <DialogDescription>
            Crie um novo modelo de contrato para ser usado no sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Modelo*</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Contrato de Trabalho"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição*</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente o propósito deste modelo"
              required
              rows={3}
            />
          </div>
          
          <div className="space-y-4">
            <Label>Conteúdo do Modelo*</Label>
            
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={inputMethod === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod('text')}
                className="flex items-center gap-2"
              >
                <Type className="w-4 h-4" />
                Digitar Texto
              </Button>
              <Button
                type="button"
                variant={inputMethod === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod('file')}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Arquivo
              </Button>
            </div>
            
            {inputMethod === 'text' ? (
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Cole ou digite o texto do contrato aqui..."
                required
                rows={12}
                className="font-mono text-sm"
              />
            ) : (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".txt,.doc,.docx,.md"
                  onChange={handleFileUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-500">
                  Suporta arquivos .txt, .doc, .docx e .md
                </p>
                {template && (
                  <div className="mt-4">
                    <Label>Preview do Conteúdo:</Label>
                    <Textarea
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      rows={8}
                      className="font-mono text-sm mt-2"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !name.trim() || !description.trim() || !template.trim()}
            >
              {isLoading ? 'Salvando...' : 'Prosseguir'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTemplateModal;
