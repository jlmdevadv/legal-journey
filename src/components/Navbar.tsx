
import React from 'react';
import { FileText } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="bg-white text-contractPrimary shadow-sm border-b border-gray-100">
      <div className="container mx-auto py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-xl font-bold">Legal Journey</h1>
        </div>
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
      </div>
    </header>
  );
};

export default Navbar;
