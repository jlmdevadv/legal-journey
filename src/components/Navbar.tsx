
import React from 'react';
import { FileText } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="bg-contractPrimary text-white shadow-md">
      <div className="container mx-auto py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-xl font-bold">Contrato Completo Fácil</h1>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <a href="/" className="hover:text-blue-200 transition-colors">
                Início
              </a>
            </li>
            <li>
              <a href="#templates" className="hover:text-blue-200 transition-colors">
                Modelos
              </a>
            </li>
            <li>
              <a href="#about" className="hover:text-blue-200 transition-colors">
                Sobre
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
