
import React from 'react';
import { contractTemplates } from '../data/contractTemplates';
import { useContract } from '../contexts/ContractContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowRight } from 'lucide-react';

const TemplateSelector = () => {
  const { selectTemplate } = useContract();

  return (
    <div id="templates" className="py-8">
      <h2 className="text-2xl font-bold mb-6 text-contractPrimary text-center">Escolha um modelo de contrato</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contractTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-lg transition-all border-2 border-gray-200 hover:border-contractAccent group overflow-hidden"
            onClick={() => selectTemplate(template)}
          >
            <CardHeader className="bg-gray-50 border-b relative">
              <CardTitle className="flex items-center gap-2 text-contractPrimary">
                <FileText className="w-5 h-5" />
                {template.name}
              </CardTitle>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-contractAccent" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <CardDescription className="text-sm text-gray-600">
                {template.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
