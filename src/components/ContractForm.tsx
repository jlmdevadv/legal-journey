
import React from 'react';
import { useContract } from '../contexts/ContractContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download } from 'lucide-react';

const ContractForm = () => {
  const { selectedTemplate, formValues, updateFormValue, resetForm } = useContract();

  if (!selectedTemplate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('contract-preview');
    if (!element) return;
    
    const contractContent = element.innerText;
    const blob = new Blob([contractContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h3 className="text-xl font-bold text-contractPrimary">{selectedTemplate.name}</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetForm}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 border-blue-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>
      
      <form className="space-y-6">
        {selectedTemplate.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            
            {field.type === 'textarea' ? (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                value={formValues[field.id] || ''}
                onChange={(e) => updateFormValue(field.id, e.target.value)}
                className="resize-y border-gray-200 focus:border-blue-300"
                rows={4}
              />
            ) : field.type === 'select' ? (
              <Select 
                value={formValues[field.id] || ''} 
                onValueChange={(value) => updateFormValue(field.id, value)}
              >
                <SelectTrigger className="border-gray-200 focus:border-blue-300">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={formValues[field.id] || ''}
                onChange={(e) => updateFormValue(field.id, e.target.value)}
                className="border-gray-200 focus:border-blue-300"
              />
            )}
          </div>
        ))}
        
        <div className="flex space-x-4 pt-4 border-t mt-6">
          <Button 
            type="button" 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleDownload}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;
