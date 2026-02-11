import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Shield, User, LogOut, Briefcase } from 'lucide-react';
import AddTemplateModal from './admin/AddTemplateModal';
import TemplateImporter from './admin/TemplateImporter';

const Navbar = () => {
  const { user, isAdmin, isMaster, signOut } = useAuth();
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-contractPrimary">
              Legal Journey
            </Link>
            <div className="hidden md:flex space-x-6">
              <a href="/" className="text-gray-700 hover:text-contractPrimary transition">
                Início
              </a>
              <a href="/#templates" className="text-gray-700 hover:text-contractPrimary transition">
                Modelos
              </a>
              <a href="/#about" className="text-gray-700 hover:text-contractPrimary transition">
                Sobre
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/meus-contratos">
                  <Button variant="ghost">
                    Meus Contratos
                  </Button>
                </Link>
                
                {isMaster && (
                  <Link to="/master">
                    <Button variant="ghost">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Painel do Escritório
                    </Button>
                  </Link>
                )}

                {isAdmin && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddTemplate(true)}
                    >
                      Adicionar Modelo
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowImporter(true)}
                    >
                      Importar JSON
                    </Button>
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.email}</p>
                        {isAdmin && (
                          <p className="text-xs leading-none text-muted-foreground flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Administrador
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button>
                  <User className="mr-2 h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {isAdmin && (
        <>
          <AddTemplateModal 
            open={showAddTemplate} 
            onOpenChange={setShowAddTemplate} 
          />
          <TemplateImporter 
            open={showImporter} 
            onOpenChange={setShowImporter} 
          />
        </>
      )}
    </header>
  );
};

export default Navbar;
