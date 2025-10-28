import React, { useState } from 'react';
import { useContract } from '../contexts/ContractContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Edit, Pencil } from 'lucide-react';
import { RenameTemplateModal } from './admin/RenameTemplateModal';

const TemplateSelector = () => {
  const { 
    selectTemplate, 
    isAdminMode, 
    customTemplates,
    isLoadingTemplates,
    startEditingTemplate,
    deleteCustomTemplate,
    renameTemplate
  } = useContract();

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [templateToRename, setTemplateToRename] = useState<any>(null);

  if (isLoadingTemplates) {
    return (
      <div id="templates" className="py-8">
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-contractPrimary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando templates...</p>
          </div>
        </div>
      </div>
    );
  }

  const allTemplates = customTemplates;

  const handleEditTemplate = (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    startEditingTemplate(template);
  };

  const handleDeleteTemplate = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteCustomTemplate(templateId);
    }
  };

  const handleRenameTemplate = (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    setTemplateToRename(template);
    setRenameModalOpen(true);
  };

  const handleConfirmRename = (newName: string) => {
    if (templateToRename) {
      renameTemplate(templateToRename.id, newName);
    }
  };

  return (
    <div id="templates" className="py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-contractPrimary">Escolha um modelo de contrato</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {allTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-md transition-all border border-gray-100 hover:border-blue-200 group overflow-hidden"
            onClick={() => selectTemplate(template)}
          >
            <CardHeader className="bg-white border-b relative pb-3">
              <CardTitle className="flex items-center gap-2 text-contractPrimary">
                <FileText className="w-5 h-5" />
                <div className="flex flex-col">
                  <span>{template.name}</span>
                  {isAdminMode && template.version && (
                    <span className="text-xs text-gray-500 font-normal">
                      {template.version.version} {template.version.date}
                    </span>
                  )}
                </div>
                {template.id.startsWith('custom-') && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Personalizado
                  </span>
                )}
              </CardTitle>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <CardDescription className="text-sm text-gray-600">
                {template.description}
              </CardDescription>
              {isAdminMode && (
                <div className="mt-3 pt-3 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleRenameTemplate(e, template)}
                    className="flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Renomear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleEditTemplate(e, template)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Editor Visual
                  </Button>
                  {template.id.startsWith('custom-') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleDeleteTemplate(e, template.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              )}
              <RenameTemplateModal
                open={renameModalOpen}
                onOpenChange={setRenameModalOpen}
                currentName={templateToRename?.name || ''}
                onConfirm={handleConfirmRename}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
