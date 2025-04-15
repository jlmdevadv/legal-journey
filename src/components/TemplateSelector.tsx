
import React from 'react';
import { contractTemplates } from '../data/contractTemplates';
import { useContract } from '../contexts/ContractContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowRight } from 'lucide-react';

const TemplateSelector = () => {
  const { selectTemplate } = useContract();

  return (
    <div id="templates" className="py-8">
      <h2 className="text-3xl font-bold mb-8 text-contractPrimary text-center">Escolha um modelo de contrato</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {contractTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-md transition-all border border-gray-100 hover:border-blue-200 group overflow-hidden"
            onClick={() => selectTemplate(template)}
          >
            <CardHeader className="bg-white border-b relative pb-3">
              <CardTitle className="flex items-center gap-2 text-contractPrimary">
                <FileText className="w-5 h-5" />
                {template.name}
              </CardTitle>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-blue-500" />
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
