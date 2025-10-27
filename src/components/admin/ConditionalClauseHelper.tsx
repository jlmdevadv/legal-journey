import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ContractField } from '@/types/template';
import { toast } from 'sonner';

interface ConditionalClauseHelperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableFields: ContractField[];
  onInsert: (clauseText: string) => void;
}

export const ConditionalClauseHelper = ({ 
  open, 
  onOpenChange, 
  availableFields,
  onInsert 
}: ConditionalClauseHelperProps) => {
  const [selectedField, setSelectedField] = useState('');
  const [operator, setOperator] = useState('equals');
  const [value, setValue] = useState('');
  const [content, setContent] = useState('');
  
  const handleInsert = () => {
    if (!selectedField || !value || !content) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    const clauseText = `{{#if ${selectedField} ${operator} "${value}"}}
${content}
{{/if}}`;
    
    onInsert(clauseText);
    onOpenChange(false);
    
    // Reset
    setSelectedField('');
    setOperator('equals');
    setValue('');
    setContent('');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inserir Cláusula Condicional</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Campo de Controle</Label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o campo" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Operador</Label>
            <Select value={operator} onValueChange={setOperator}>
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
            <Label className="text-sm font-medium">Valor Esperado</Label>
            <Input 
              value={value} 
              onChange={(e) => setValue(e.target.value)}
              placeholder='Ex: "Sim"'
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Conteúdo da Cláusula</Label>
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o texto que aparecerá quando a condição for verdadeira"
              rows={6}
            />
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Preview da Sintaxe:</p>
            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`{{#if ${selectedField || 'campo'} ${operator} "${value || 'valor'}"}}\n${content || 'Conteúdo aqui...'}\n{{/if}}`}
            </pre>
          </div>
          
          <Button onClick={handleInsert} className="w-full">
            Inserir no Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
