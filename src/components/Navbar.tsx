
import React, { useState } from 'react';
import { FileText, Shield, Plus, FileJson } from 'lucide-react';
import { useContract } from '../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import AdminLogin from './admin/AdminLogin';
import AddTemplateModal from './admin/AddTemplateModal';
import TemplateImporter from './admin/TemplateImporter';

const Navbar = () => {
  const { 
    isAdminLoggedIn, 
    isAdminMode, 
    toggleAdminMode
  } = useContract();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  const handleAdminButtonClick = () => {
    if (isAdminLoggedIn) {
      toggleAdminMode();
    } else {
      setShowAdminLogin(true);
    }
  };

  return (
    <>
      <header className="bg-white text-contractPrimary shadow-sm border-b border-gray-100">
        <div className="container mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6" />
            <h1 className="text-xl font-bold">Legal Journey</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <a href="/" className="hover:text-blue-500 transition-colors font-medium">
                    Início
                  </a>
                </li>
                <li>
                  <a href="#templates" className="hover:text-blue-500 transition-colors font-medium">
                    Modelos
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-blue-500 transition-colors font-medium">
                    Sobre
                  </a>
                </li>
              </ul>
            </nav>

            <div className="flex gap-2">
              <Button
                variant={isAdminMode ? "default" : "outline"}
                onClick={handleAdminButtonClick}
                className="flex items-center gap-2"
                size="sm"
              >
                <Shield className="w-4 h-4" />
                {isAdminLoggedIn ? (isAdminMode ? 'Sair Admin' : 'Modo Administrador') : 'Modo Administrador'}
              </Button>
              
              {isAdminMode && (
                <>
                  <Button
                    onClick={() => setShowAddTemplate(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Modelo
                  </Button>
                  <Button
                    onClick={() => setShowImporter(true)}
                    variant="secondary"
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <FileJson className="w-4 h-4" />
                    Importar JSON
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <AdminLogin 
        open={showAdminLogin} 
        onOpenChange={setShowAdminLogin} 
      />
      
      <AddTemplateModal 
        open={showAddTemplate} 
        onOpenChange={setShowAddTemplate} 
      />
      
      <TemplateImporter 
        open={showImporter} 
        onOpenChange={setShowImporter}
      />
    </>
  );
};

export default Navbar;
