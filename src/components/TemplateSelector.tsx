
import React, { useState } from 'react';
import { contractTemplates } from '../data/contractTemplates';
import { useContract } from '../contexts/ContractContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Shield, Plus, Settings } from 'lucide-react';
import AdminLogin from './admin/AdminLogin';
import AddTemplateModal from './admin/AddTemplateModal';

const TemplateSelector = () => {
  const { selectTemplate, isAdminLoggedIn, isAdminMode, toggleAdminMode, customTemplates } = useContract();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  const allTemplates = [...contractTemplates, ...customTemplates];

  const handleAdminButtonClick = () => {
    if (isAdminLoggedIn) {
      toggleAdminMode();
    } else {
      setShowAdminLogin(true);
    }
  };

  return (
    <div id="templates" className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-contractPrimary">Escolha um modelo de contrato</h2>
        
        <div className="flex gap-2">
          <Button
            variant={isAdminMode ? "default" : "outline"}
            onClick={handleAdminButtonClick}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {isAdminLoggedIn ? (isAdminMode ? 'Sair Admin' : 'Modo Administrador') : 'Modo Administrador'}
          </Button>
          
          {isAdminMode && (
            <Button
              onClick={() => setShowAddTemplate(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Modelo
            </Button>
          )}
        </div>
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
                {template.name}
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
              {isAdminMode && template.id.startsWith('custom-') && (
                <div className="mt-3 pt-3 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement edit functionality
                    }}
                    className="flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    Editar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminLogin 
        open={showAdminLogin} 
        onOpenChange={setShowAdminLogin} 
      />
      
      <AddTemplateModal 
        open={showAddTemplate} 
        onOpenChange={setShowAddTemplate} 
      />
    </div>
  );
};

export default TemplateSelector;
