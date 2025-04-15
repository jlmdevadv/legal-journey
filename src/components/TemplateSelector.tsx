
import React from 'react';
import { contractTemplates } from '../data/contractTemplates';
import { useContract } from '../contexts/ContractContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const TemplateSelector = () => {
  const { selectTemplate } = useContract();

  return (
    <div id="templates" className="py-8">
      <h2 className="text-2xl font-bold mb-6 text-contractPrimary">Escolha um modelo de contrato</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contractTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-200 hover:border-contractAccent"
            onClick={() => selectTemplate(template)}
          >
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2 text-contractPrimary">
                <FileText className="w-5 h-5" />
                {template.name}
              </CardTitle>
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
